import hashlib
import hmac
import json
import os
import time
import uuid

import aiohttp


async def get_call_credentials(call_id: str) -> dict[str, str]:
    base = os.environ["API_BASE_URL"].rstrip("/")
    worker_key = os.environ.get("WORKER_API_KEY", "")
    if len(worker_key) < 32:
        raise RuntimeError("WORKER_API_KEY must contain at least 32 characters")
    timeout = aiohttp.ClientTimeout(total=8)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.get(f"{base}/voice/worker/calls/{call_id}/credentials", headers={"Authorization": f"Bearer {worker_key}"}) as response:
            if response.status >= 400:
                raise RuntimeError(f"Could not authorize voice call ({response.status})")
            result = await response.json()
            if not result.get("voiceAgentConfigId") or len(result.get("agentWebhookSecret", "")) < 32:
                raise RuntimeError("API returned invalid per-agent voice signing credentials")
            return result


async def mark_call_answered(call_id: str) -> None:
    base = os.environ["API_BASE_URL"].rstrip("/")
    worker_key = os.environ.get("WORKER_API_KEY", "")
    timeout = aiohttp.ClientTimeout(total=8)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(f"{base}/voice/worker/calls/{call_id}/answered", headers={"Authorization": f"Bearer {worker_key}"}) as response:
            if response.status >= 400:
                raise RuntimeError(f"Could not mark call answered ({response.status})")


async def mark_call_dial_failed(call_id: str, failure_type: str) -> None:
    base = os.environ["API_BASE_URL"].rstrip("/")
    worker_key = os.environ.get("WORKER_API_KEY", "")
    timeout = aiohttp.ClientTimeout(total=8)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(
            f"{base}/voice/worker/calls/{call_id}/dial-failed",
            json={"failureType": failure_type},
            headers={"Authorization": f"Bearer {worker_key}"},
        ) as response:
            if response.status >= 400:
                raise RuntimeError(f"Could not store call failure ({response.status})")


def signed_headers(agent_id: str, agent_secret: str, method: str, path: str, body: bytes) -> dict[str, str]:
    secret = agent_secret
    if len(secret.encode()) < 32:
        raise RuntimeError("VOICE_AGENT_WEBHOOK_SECRET must contain at least 32 bytes")
    timestamp = str(int(time.time()))
    nonce = str(uuid.uuid4())
    canonical = "\n".join((timestamp, nonce, method.upper(), path, body.decode("utf-8")))
    signature = hmac.new(secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()
    return {
        "Content-Type": "application/json",
        "X-Voice-Agent-Id": agent_id,
        "X-Voice-Timestamp": timestamp,
        "X-Voice-Nonce": nonce,
        "X-Voice-Signature": signature,
    }


async def call_tool(agent_id: str, agent_secret: str, route: str, payload: dict) -> dict:
    base = os.environ["API_BASE_URL"].rstrip("/")
    path = f"/api/v1/voice/tools/{route}"
    body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode()
    headers = signed_headers(agent_id, agent_secret, "POST", path, body)
    timeout = aiohttp.ClientTimeout(total=8)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(base + path.removeprefix("/api/v1"), data=body, headers=headers) as response:
            if response.status >= 400:
                raise RuntimeError(f"Voice tool request failed ({response.status})")
            return await response.json()


async def call_ended(agent_id: str, agent_secret: str, payload: dict) -> None:
    base = os.environ["API_BASE_URL"].rstrip("/")
    path = "/api/v1/voice/webhooks/call-ended"
    body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode()
    headers = signed_headers(agent_id, agent_secret, "POST", path, body)
    timeout = aiohttp.ClientTimeout(total=8)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(base + "/voice/webhooks/call-ended", data=body, headers=headers) as response:
            if response.status >= 400:
                raise RuntimeError(f"Call-ended webhook failed ({response.status})")
