import asyncio
import json
import logging
import os
import re
import uuid

from aiohttp import web
from dotenv import load_dotenv
from livekit import api
from livekit.protocol.sip import SIPOutboundConfig
from .security import get_call_credentials, mark_call_answered, mark_call_dial_failed

load_dotenv()

def authorize(request: web.Request) -> None:
    expected = os.environ.get("WORKER_API_KEY", "")
    supplied = request.headers.get("Authorization", "").removeprefix("Bearer ")
    import hmac
    if len(expected) < 32 or not hmac.compare_digest(expected, supplied):
        raise web.HTTPUnauthorized()


async def start_call(request: web.Request) -> web.Response:
    authorize(request)
    payload = await request.json()
    required = ("callId", "tenantRef", "voiceAgentConfigId", "phoneNumber", "customerFirstName", "maskedInvoiceReference", "businessName", "language")
    if any(not isinstance(payload.get(key), str) or not payload[key] for key in required):
        raise web.HTTPBadRequest(text="Invalid call payload")
    if not re.fullmatch(r"\+[1-9]\d{7,14}", payload["phoneNumber"]):
        raise web.HTTPBadRequest(text="Invalid destination number")
    if not os.environ.get("LIVEKIT_URL") or not os.environ.get("LIVEKIT_API_KEY") or not os.environ.get("LIVEKIT_API_SECRET"):
        raise web.HTTPServiceUnavailable(text="LiveKit is not configured")
    stt_provider = os.environ.get("VOICE_STT_PROVIDER", "sarvam").lower()
    tts_provider = os.environ.get("VOICE_TTS_PROVIDER", "sarvam").lower()
    if stt_provider not in {"sarvam", "ai4bharat-compatible"} or tts_provider not in {"sarvam", "ai4bharat-compatible"} or os.environ.get("VOICE_LLM_PROVIDER", "openai").lower() != "openai":
        raise web.HTTPServiceUnavailable(text="Configured voice model provider is not supported")
    sarvam_ready = stt_provider == "sarvam" or tts_provider == "sarvam"
    compatible_ready = (stt_provider == "ai4bharat-compatible" and os.environ.get("VOICE_STT_BASE_URL")) or (tts_provider == "ai4bharat-compatible" and os.environ.get("VOICE_TTS_BASE_URL"))
    if (sarvam_ready and not os.environ.get("SARVAM_API_KEY")) or (compatible_ready and not os.environ.get("VOICE_SPEECH_API_KEY")) or not os.environ.get("VOICE_LLM_API_KEY"):
        raise web.HTTPServiceUnavailable(text="Speech and language model credentials are not configured")
    trunk_id = os.environ.get("LIVEKIT_OUTBOUND_TRUNK_ID")
    if not trunk_id and not (os.environ.get("SIP_TRUNK_HOSTNAME") and os.environ.get("SIP_FROM_NUMBER")):
        raise web.HTTPServiceUnavailable(text="An outbound SIP trunk is not configured")
    try:
        credentials = await get_call_credentials(payload["callId"])
    except Exception:
        raise web.HTTPServiceUnavailable(text="API could not authorize this call")
    if credentials["voiceAgentConfigId"] != payload["voiceAgentConfigId"]:
        raise web.HTTPUnauthorized(text="Call does not belong to this voice agent")
    room = "bp-" + uuid.uuid4().hex
    asyncio.create_task(place_call(payload, room, trunk_id))
    return web.json_response({"status": "accepted"}, status=202)


async def place_call(payload: dict, room: str, trunk_id: str | None) -> None:
    lk = api.LiveKitAPI()
    try:
        metadata = json.dumps({key: value for key, value in payload.items() if key not in {"phoneNumber", "agentWebhookSecret", "tenantRef"}}, separators=(",", ":"))
        await lk.agent_dispatch.create_dispatch(api.CreateAgentDispatchRequest(
            agent_name=os.environ.get("LIVEKIT_AGENT_NAME", "billpilot-payment-agent"), room=room, metadata=metadata,
        ))
        dial_args = dict(
            sip_trunk_id=trunk_id or "",
            room_name=room,
            sip_call_to=payload["phoneNumber"],
            participant_identity="customer-" + payload["callId"],
            participant_name="Customer",
            wait_until_answered=True,
        )
        if not trunk_id:
            dial_args["sip_number"] = os.environ["SIP_FROM_NUMBER"]
            dial_args["trunk"] = SIPOutboundConfig(
                hostname=os.environ["SIP_TRUNK_HOSTNAME"],
                auth_username=os.environ.get("SIP_AUTH_USERNAME", ""),
                auth_password=os.environ.get("SIP_AUTH_PASSWORD", ""),
            )
            dial_args.pop("sip_trunk_id")
        req = api.CreateSIPParticipantRequest(**dial_args)
        await lk.sip.create_sip_participant(req)
        try:
            await mark_call_answered(payload["callId"])
        except Exception:
            logging.getLogger("billpilot.voice.gateway").warning("Call was answered but API status update failed for %s", payload["callId"])
            try:
                await lk.room.delete_room(api.DeleteRoomRequest(room=room))
            except Exception:
                pass
    except Exception as exc:
        code = getattr(exc, "sip_status_code", None)
        if code is None:
            code = getattr(exc, "status_code", None)
        try:
            code = int(code)
        except (TypeError, ValueError):
            code = None
        failure_type = "NO_ANSWER" if code in {408, 480} else "BUSY" if code in {486, 603} else "SIP_FAILURE"
        try:
            await mark_call_dial_failed(payload["callId"], failure_type)
        except Exception:
            logging.getLogger("billpilot.voice.gateway").warning("Could not store failed call outcome for %s", payload["callId"])
        try:
            await lk.room.delete_room(api.DeleteRoomRequest(room=room))
        except Exception:
            pass
    finally:
        await lk.aclose()


async def health(_: web.Request) -> web.Response:
    return web.json_response({"status": "ok"})


async def ready(_: web.Request) -> web.Response:
    stt_provider = os.environ.get("VOICE_STT_PROVIDER", "sarvam").lower()
    tts_provider = os.environ.get("VOICE_TTS_PROVIDER", "sarvam").lower()
    sip_ready = bool(os.environ.get("LIVEKIT_OUTBOUND_TRUNK_ID") or (os.environ.get("SIP_TRUNK_HOSTNAME") and os.environ.get("SIP_FROM_NUMBER")))
    checks = {
        "api": bool(os.environ.get("API_BASE_URL") and len(os.environ.get("WORKER_API_KEY", "")) >= 32),
        "livekit": bool(os.environ.get("LIVEKIT_URL") and os.environ.get("LIVEKIT_API_KEY") and os.environ.get("LIVEKIT_API_SECRET")),
        "sipTrunk": sip_ready,
        "llm": bool(os.environ.get("VOICE_LLM_API_KEY")),
        "stt": bool(os.environ.get("SARVAM_API_KEY")) if stt_provider == "sarvam" else bool(os.environ.get("VOICE_STT_BASE_URL") and os.environ.get("VOICE_SPEECH_API_KEY")),
        "tts": bool(os.environ.get("SARVAM_API_KEY")) if tts_provider == "sarvam" else bool(os.environ.get("VOICE_TTS_BASE_URL") and os.environ.get("VOICE_SPEECH_API_KEY")),
    }
    ok = all(checks.values())
    return web.json_response({"status": "ready" if ok else "not_ready", "checks": checks}, status=200 if ok else 503)


def main() -> None:
    app = web.Application(client_max_size=32 * 1024)
    app.router.add_get("/health", health)
    app.router.add_get("/ready", ready)
    app.router.add_post("/calls/start", start_call)
    web.run_app(app, host=os.environ.get("WORKER_HOST", "127.0.0.1"), port=int(os.environ.get("WORKER_PORT", "8091")))


if __name__ == "__main__":
    main()
