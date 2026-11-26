# ollaiBooks implementation and deployment notes

## Security and tenant context

The API authenticates bearer JWTs, reloads active user memberships on each request, and scopes data using the selected `x-tenant-id`. Tenant routes also enforce permission names on the server. The web client stores its bearer token in session storage and requires a valid session before rendering workspace pages.

## Integrations

- Website orders are accepted at `POST /api/v1/integrations/webhooks/:websiteId` with `X-Billpilot-Signature: sha256=<HMAC-SHA256 of exact raw body>`. Connected website secrets are encrypted at rest. Product SKU, price, tax, currency, event id, external order id, and customer state are checked against the tenant catalog/profile; sender-supplied paid status is ignored.
- WhatsApp Cloud API credentials are encrypted per tenant. A send requires an issued invoice, an E.164 customer phone, and a recorded consent entry. Provider credentials and an approved invoice template are supplied in the WhatsApp settings page.
- The AI assistant sends only the user's question and tenant-scoped aggregate billing facts to the configured model. It has no database write tools and does not receive customer rows.
- Voice calls remain disabled. The API returns an explicit not-configured error and does not create a completed-call record.
- Automation test runs are dry runs. Definitions are stored, but a production event worker and configured side-effect adapters are still required before activation.

## AK Webflair admin panel

The AK Express backend proxies `/api/admin/billdesk/overview` after validating its existing admin bearer session. It sends `BILLDESK_AK_ADMIN_KEY` server-to-server to ollaiBooks `GET /api/v1/admin-bridge/overview`. Set `AK_ADMIN_SERVICE_KEY` to the same random value in the ollaiBooks API environment. The key must not be exposed to Vite/browser variables.

## Environment and data setup

Copy `apps/api/.env.example` to the API's private environment file and set a unique `JWT_SECRET`, `INTEGRATION_ENCRYPTION_KEY` (32 random bytes as 64 hex characters), database URL, Redis settings, API/web origins, and the AK bridge key. Set `OPENAI_API_KEY` only if enabling the aggregate assistant. Set up a WhatsApp Cloud account and approved template before sending.

`prisma/migrations/20261023000000_billdesk_baseline/migration.sql` is a baseline generated from an empty PostgreSQL database. It has not been applied. For a new database, review it and deploy with Prisma migrate. For an existing database, first compare its schema and baseline its migration history; do not run this baseline blindly against existing production data.

## Remaining production work

Before production use, add login rate limiting and recovery/MFA, move browser authentication to an HttpOnly cookie session with CSRF protection, finish consent-proof capture and WhatsApp delivery callbacks, implement a supported voice provider plus voice consent, add a persisted automation event worker and retry policy, and add database integration tests against isolated PostgreSQL/Redis. Validate GST invoice/credit-note policy and configure the business profile with the company's real registration and address before issuing legal invoices.
