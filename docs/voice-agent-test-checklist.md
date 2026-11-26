# Voice agent release checklist

Run these with a test tenant, a test phone number, and an approved test WhatsApp template. Do not use a customer list until the carrier, prompts, consent flow, and support escalation have been reviewed.

- [ ] Happy path: AI disclosure and recording notice, identity confirmation, exact server balance read in words, payment link offer, outcome stored.
- [ ] “I already paid”: no pressure; record `PAID_ALREADY`; confirm the business will verify if needed.
- [ ] Wrong number: reveal no bill detail; record `WRONG_NUMBER`.
- [ ] Wrong amount: do not calculate or argue; record `DISPUTED` and route for human review.
- [ ] Dispute: record `DISPUTED`; no false promise that it was resolved.
- [ ] Angry caller: remain calm, offer human follow up, honor a stop request.
- [ ] Interruption: barge-in stops the agent speech and responds to the new turn.
- [ ] Silence: ask a brief check-in, then end without exposing information and store an outcome.
- [ ] Language switch: switch language on request and verify STT, LLM response, and TTS pronunciation.
- [ ] “Are you a robot?”: answer truthfully that it is an AI assistant.
- [ ] “Stop calling”: apologize, persist DNC immediately, and confirm no future call is queued.
- [ ] Asks for a human: transfer only if the destination is configured; otherwise offer a callback.
- [ ] Someone else answers: reveal no account or invoice data and record `WRONG_NUMBER`.
- [ ] Tenant isolation: tenant A's signed configuration cannot read tenant B's call or bill; body-supplied tenant IDs are ignored.
- [ ] HMAC: invalid signature, stale timestamp, reused nonce, disabled agent, and over-limit requests are rejected.
- [ ] Call checks: paid invoice, missing/revoked consent, DNC number, outside-hours, and attempts beyond max are skipped with reason.
- [ ] Payment hook: final payment removes delayed/waiting calls and changes queued call rows to `CANCELED`.
- [ ] Retention: old call transcript and recording URL pointers are cleared after configured retention.
- [ ] Logs: no full phone, secret, or transcript is logged at info level.
