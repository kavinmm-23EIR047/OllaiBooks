import asyncio
import json
import logging
import os
import re
from decimal import Decimal

from dotenv import load_dotenv
from livekit import agents, api
from livekit.agents import Agent, AgentSession, RunContext, function_tool
from livekit.plugins import openai, sarvam

from .security import call_ended, call_tool, get_call_credentials, mark_call_answered, mark_call_dial_failed

load_dotenv()
logging.basicConfig(level=os.getenv("LOG_LEVEL", "WARNING"))
logger = logging.getLogger("billpilot.voice")
server = agents.AgentServer()
active_sessions: dict[str, tuple[AgentSession, dict, float, "PaymentReminderAgent"]] = {}

LANGUAGE_NAMES = {"en-IN": "English", "hi-IN": "Hindi", "ta-IN": "Tamil", "te-IN": "Telugu", "ml-IN": "Malayalam", "kn-IN": "Kannada"}


def amount_in_words(value: str, currency: str) -> str:
    """Speak the exact server-returned decimal; never derive a balance from invoice lines."""
    amount = Decimal(value)
    rupees, paise = divmod(int(amount * 100), 100)
    def under_1000(n: int) -> str:
        ones = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
        tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
        parts = []
        if n >= 100:
            parts += [ones[n // 100], "hundred"]
            n %= 100
        if n >= 20:
            parts.append(tens[n // 10]); n %= 10
        if n:
            parts.append(ones[n])
        return " ".join(parts) or "zero"
    def indian(n: int) -> str:
        if n < 1000:
            return under_1000(n)
        for unit, divisor in (("crore", 10_000_000), ("lakh", 100_000), ("thousand", 1000)):
            if n >= divisor:
                head, tail = divmod(n, divisor)
                return indian(head) + " " + unit + (" " + indian(tail) if tail else "")
        return under_1000(n)
    label = "rupees" if currency.upper() == "INR" else currency.upper()
    phrase = f"{indian(rupees)} {label}"
    if paise:
        phrase += f" and {under_1000(paise)} paise"
    return phrase


def make_models(language: str, voice: str, sample_rate: int = 8000):
    stt_provider = os.getenv("VOICE_STT_PROVIDER", "sarvam").lower()
    tts_provider = os.getenv("VOICE_TTS_PROVIDER", "sarvam").lower()
    speech_key = os.getenv("VOICE_SPEECH_API_KEY", "")
    stt_base_url = os.getenv("VOICE_STT_BASE_URL", "")
    tts_base_url = os.getenv("VOICE_TTS_BASE_URL", "")
    if stt_provider == "sarvam":
        if not os.getenv("SARVAM_API_KEY"):
            raise RuntimeError("SARVAM_API_KEY is required for Sarvam speech recognition")
        stt_model = sarvam.STT(language=language, model="saaras:v4", mode="transcribe")
    elif stt_provider == "ai4bharat-compatible":
        if not stt_base_url or not speech_key:
            raise RuntimeError("AI4Bharat-compatible STT requires VOICE_STT_BASE_URL and VOICE_SPEECH_API_KEY")
        stt_model = openai.STT(model=os.getenv("VOICE_STT_MODEL", "whisper-1"), language=language, api_key=speech_key, base_url=stt_base_url, use_realtime=False)
    else:
        raise RuntimeError("VOICE_STT_PROVIDER must be sarvam or ai4bharat-compatible")
    if tts_provider == "sarvam":
        if not os.getenv("SARVAM_API_KEY"):
            raise RuntimeError("SARVAM_API_KEY is required for Sarvam speech synthesis")
        tts_model = sarvam.TTS(target_language_code=language, model="bulbul:v3", speaker=voice if voice != "default" else "shubh", speech_sample_rate=sample_rate)
    elif tts_provider == "ai4bharat-compatible":
        if not tts_base_url or not speech_key:
            raise RuntimeError("AI4Bharat-compatible TTS requires VOICE_TTS_BASE_URL and VOICE_SPEECH_API_KEY")
        tts_model = openai.TTS(model=os.getenv("VOICE_TTS_MODEL", "tts-1"), voice=voice if voice != "default" else "alloy", api_key=speech_key, base_url=tts_base_url)
    else:
        raise RuntimeError("VOICE_TTS_PROVIDER must be sarvam or ai4bharat-compatible")
    llm_provider = os.getenv("VOICE_LLM_PROVIDER", "openai").lower()
    if llm_provider != "openai":
        raise RuntimeError("Set VOICE_LLM_PROVIDER=openai for the currently implemented OpenAI-compatible LLM adapter")
    llm_key = os.getenv("VOICE_LLM_API_KEY")
    if not llm_key:
        raise RuntimeError("VOICE_LLM_API_KEY is required")
    return (
        stt_model,
        openai.LLM(model=os.getenv("VOICE_LLM_MODEL", "gpt-4o-mini"), api_key=llm_key, base_url=os.getenv("VOICE_LLM_BASE_URL") or None, temperature=0.2),
        tts_model,
    )


class PaymentReminderAgent(Agent):
    def __init__(self, data: dict):
        language = data.get("language", os.getenv("VOICE_DEFAULT_LANGUAGE", "en-IN"))
        business = data.get("businessName", "the business")
        name = data.get("customerFirstName", "Customer")
        greeting = data.get("greeting", "").strip()
        test_mode = data.get("testMode") is True
        if test_mode and data.get("webCall") is True:
            instructions = f"""You are the AI phone assistant for {business}, answering an internet voice call from the business app. Speak in {LANGUAGE_NAMES.get(language, language)} and switch if the caller asks or switches language. Talk like a friendly phone receptionist: short natural sentences, one question at a time. If asked, say truthfully that you are an AI assistant. You cannot see any customer, invoice, payment or account data on this call, so never invent amounts, order details or account information; if asked, say the business team can help with that. Never ask for card numbers, OTPs, UPI PINs or passwords. When the caller says goodbye, say goodbye politely."""
            if greeting:
                instructions += f" Use this configured greeting style when you answer: {greeting}"
            super().__init__(instructions=instructions)
            self.data = data
            self.identity_confirmed = False
            self.last_user_text = ""
            self.bill = None
            self.outcome_logged = False
            return
        if test_mode:
            instructions = f"""You are an AI voice agent test for {business}. Speak in {LANGUAGE_NAMES.get(language, language)}. Say you are an AI assistant and this is a test call. Say one short greeting, then ask the listener to say a few words so the speech conversation can be checked. Do not discuss invoices, money, payment links, account details, or request personal or financial information. Respond briefly to what the listener says, confirm the voice test is working, then politely end the conversation."""
            if greeting:
                instructions += f" Use this configured greeting style after the test disclosure: {greeting}"
            super().__init__(instructions=instructions)
            self.data = data
            self.identity_confirmed = False
            self.last_user_text = ""
            self.bill = None
            self.outcome_logged = False
            return
        instructions = f"""You are an AI assistant calling on behalf of {business}. Speak in {LANGUAGE_NAMES.get(language, language)} and switch if the caller asks or switches language. Start by saying you are an AI assistant and that the call may be recorded. Then ask exactly whether you are speaking with {name}. Do not reveal any bill details, business-sensitive details or invoice identifiers until they clearly confirm yes. If another person answers, reveal nothing, say goodbye and call log_outcome with WRONG_NUMBER.\n\nUse short sentences and one question at a time. Never request card numbers, OTPs, UPI PINs or passwords. Offer a verified payment link instead. Never invent, estimate or derive an amount: call get_bill only after identity confirmation, then speak the returned balance in words and repeat important details. Never imply a threat or fake urgency. If asked whether you are a robot, answer truthfully that you are an AI assistant. If asked to stop, apologise, log DO_NOT_CALL immediately and politely end. Handle already paid, disputes, wrong amount, call later, anger, silence and interruptions calmly. Offer human transfer when asked. Do not promise a payment was made unless the caller says so. Keep the call focused and brief."""
        if greeting:
            instructions += f"\nThe business configured this opening style (keep AI disclosure and recording notice): {greeting}"
        super().__init__(instructions=instructions)
        self.data = data
        self.identity_confirmed = False
        self.last_user_text = ""
        self.bill: dict | None = None
        self.outcome_logged = False

    @function_tool
    async def confirm_customer_identity(self, context: RunContext, confirmed: bool):
        """Call only after the caller explicitly answers yes to being the named customer. Checks the latest recognized caller response."""
        text = self.last_user_text.strip().lower()
        affirmative = re.match(r"^(yes|yeah|yep|haan|han|ji haan|ஆம்|ஆமாம்|అవును|അതെ|ಹೌದು)(\b|[\s,.!?]|$)", text, flags=re.IGNORECASE)
        self.identity_confirmed = confirmed is True and affirmative is not None
        if not self.identity_confirmed:
            return "Do not provide bill details until the person confirms their identity. Ask them to confirm clearly."
        return "Identity confirmation heard. You may now fetch this call's bill."

    @function_tool
    async def get_bill(self, context: RunContext):
        """Fetch the unpaid invoice balance after confirm_customer_identity succeeded."""
        if self.data.get("testMode"):
            return "Billing tools are disabled in a voice test. Continue only with the voice conversation."
        if not self.identity_confirmed:
            return "Do not provide bill details until the person confirms their identity."
        result = await call_tool(self.data["voiceAgentConfigId"], self.data["agentWebhookSecret"], "get-bill", {"callId": self.data["callId"], "identityConfirmed": True})
        self.bill = result
        words = amount_in_words(result["balanceDue"], result["currency"])
        return {**result, "spokenBalance": words}

    @function_tool
    async def send_payment_link(self, context: RunContext):
        """Send the verified bill payment link to the customer's WhatsApp number."""
        if self.data.get("testMode"):
            return "Payment links are disabled in a voice test. Continue only with the voice conversation."
        if not self.identity_confirmed or not self.bill:
            return "First confirm identity and fetch the bill."
        return await call_tool(self.data["voiceAgentConfigId"], self.data["agentWebhookSecret"], "send-payment-link", {"callId": self.data["callId"]})

    @function_tool
    async def log_outcome(self, context: RunContext, outcome: str):
        """Record the call outcome. Use only a supported outcome: WILL_PAY, PAID_ALREADY, DISPUTED, WRONG_NUMBER, CALL_LATER, DO_NOT_CALL, NO_ANSWER, TRANSFERRED."""
        if self.data.get("testMode"):
            return "Call outcome tools are disabled in a voice test."
        supported = {"WILL_PAY", "PAID_ALREADY", "DISPUTED", "WRONG_NUMBER", "CALL_LATER", "DO_NOT_CALL", "NO_ANSWER", "TRANSFERRED"}
        chosen = outcome.upper()
        if chosen not in supported:
            return "Unsupported outcome."
        response = await call_tool(self.data["voiceAgentConfigId"], self.data["agentWebhookSecret"], "log-outcome", {"callId": self.data["callId"], "outcome": chosen})
        self.outcome_logged = True
        return response

    @function_tool
    async def transfer_to_human(self, context: RunContext):
        """Transfer the caller to a configured human support number, if one is available."""
        if self.data.get("testMode"):
            return "Human transfer is disabled in a voice test."
        number = os.getenv("HUMAN_TRANSFER_NUMBER", "")
        if not number:
            return "Human transfer is not configured. Apologise, offer to have the business call them back, and log CALL_LATER if they agree."
        context.disallow_interruptions()
        try:
            lk = api.LiveKitAPI()
            try:
                await lk.sip.transfer_sip_participant(api.TransferSIPParticipantRequest(
                    room_name=context.session.room.name,
                    participant_identity="customer-" + self.data["callId"],
                    transfer_to="tel:" + number,
                    play_dialtone=True,
                ))
            finally:
                await lk.aclose()
            await call_tool(self.data["voiceAgentConfigId"], self.data["agentWebhookSecret"], "log-outcome", {"callId": self.data["callId"], "outcome": "TRANSFERRED"})
            self.outcome_logged = True
            return "A human support representative has joined. Introduce the caller and let them speak."
        except Exception:
            logger.warning("Configured human transfer could not be completed")
            return "The transfer could not be completed. Apologise and offer a callback."


async def on_session_end(ctx: agents.JobContext):
    active = active_sessions.pop(ctx.room.name, None)
    if not active:
        return
    session, data, started, call_agent = active
    history = getattr(session, "history", None)
    transcript = "\n".join(f"{getattr(item, 'role', 'unknown')}: {getattr(item, 'text_content', '')}" for item in getattr(history, "items", []) if getattr(item, "type", None) == "message")[:50_000]
    duration = max(0, int(asyncio.get_running_loop().time() - started))
    if not call_agent.outcome_logged and not transcript:
        try:
            await call_tool(data["voiceAgentConfigId"], data["agentWebhookSecret"], "log-outcome", {"callId": data["callId"], "outcome": "NO_ANSWER"})
        except Exception:
            logger.warning("Unable to log final voice outcome for call id %s", data["callId"])
    try:
        await call_ended(data["voiceAgentConfigId"], data["agentWebhookSecret"], {"callId": data["callId"], "transcript": transcript, "durationSec": duration})
    except Exception:
        logger.warning("Unable to submit call completion for call id %s", data["callId"])


@server.rtc_session(agent_name=os.getenv("LIVEKIT_AGENT_NAME", "billpilot-payment-agent"), on_session_end=on_session_end)
async def payment_agent(ctx: agents.JobContext):
    data = json.loads(ctx.job.metadata or "{}")
    if not data.get("callId") or not data.get("voiceAgentConfigId"):
        logger.warning("Rejected voice session with missing call identifiers")
        ctx.shutdown()
        return
    try:
        credentials = await get_call_credentials(data["callId"])
        if credentials["voiceAgentConfigId"] != data["voiceAgentConfigId"]:
            raise RuntimeError("Voice agent configuration does not match this call")
        data.update(credentials)
    except Exception:
        logger.warning("Could not retrieve signing credentials for call id %s", data["callId"])
        await mark_call_dial_failed(data["callId"], "AGENT_FAILURE")
        ctx.shutdown()
        return
    web_call = data.get("webCall") is True
    await ctx.connect()
    if web_call:
        try:
            # The caller may hang up while it is still ringing; do not wait forever.
            caller = await asyncio.wait_for(ctx.wait_for_participant(identity=data.get("callerIdentity")), timeout=45)
        except asyncio.TimeoutError:
            try:
                await mark_call_dial_failed(data["callId"], "NO_ANSWER")
            except Exception:
                logger.warning("Could not store unanswered web call %s", data["callId"])
            ctx.shutdown(reason="web caller never joined")
            return
    else:
        await ctx.wait_for_participant()
    if web_call:
        try:
            await mark_call_answered(data["callId"])
        except Exception:
            logger.warning("Could not mark web call answered for call id %s", data["callId"])

        @ctx.room.on("participant_disconnected")
        def on_caller_left(participant):
            if participant.identity == caller.identity:
                ctx.shutdown(reason="caller hung up")
    language = data.get("language", os.getenv("VOICE_DEFAULT_LANGUAGE", "en-IN"))
    speaker = data.get("voiceId", os.getenv("VOICE_DEFAULT_ID", "default"))
    try:
        stt, llm, tts = make_models(language, speaker, 24000 if web_call else 8000)
    except Exception:
        logger.warning("Voice model initialization failed for call id %s", data["callId"])
        await mark_call_dial_failed(data["callId"], "AGENT_FAILURE")
        ctx.shutdown()
        return
    session = AgentSession(stt=stt, llm=llm, tts=tts)
    started = asyncio.get_running_loop().time()
    call_agent = PaymentReminderAgent(data)
    active_sessions[ctx.room.name] = (session, data, started, call_agent)

    @session.on("user_input_transcribed")
    def on_user_input_transcribed(event):
        if event.is_final:
            call_agent.last_user_text = event.transcript[:1000]

    try:
        await session.start(agent=call_agent, room=ctx.room)
        opening = "Answer the call now like a phone receptionist: greet the caller warmly, say you are the AI assistant for the business, and ask how you can help today. Keep it to one or two short sentences." if web_call else "Say this is an AI voice test, greet the listener, and ask them to say a few words so the voice conversation can be checked. Do not mention invoices or payments." if data.get("testMode") else "Greet the caller now. Introduce yourself as an AI assistant, say the call may be recorded, and ask whether you are speaking with the named customer. Do not mention any invoice or amount."
        await session.generate_reply(instructions=opening)
    except Exception:
        logger.warning("Voice session failed for call id %s", data["callId"])
        await mark_call_dial_failed(data["callId"], "AGENT_FAILURE")
        await session.aclose()


if __name__ == "__main__":
    agents.cli.run_app(server)
