# Customer access setup

The API uses the PostgreSQL database configured by `DATABASE_URL` in `.env`.

1. Start PostgreSQL, then run `npm run db:migrate` and `npm run db:generate`.
2. Set a platform administrator before seeding. In PowerShell:

   ```powershell
   $env:PLATFORM_ADMIN_EMAIL = "admin@yourcompany.in"
   $env:PLATFORM_ADMIN_PASSWORD = "use-a-long-unique-password"
   npm run db:seed
   ```

   The seed script promotes or creates that account as the platform admin. It no longer uses a built-in demo password.
3. Start the app with `npm run dev`, sign in at `/login`, and open `/admin`.
4. In **Add customer account**, enter the customer’s business name, sign-in email, temporary password, subscription plan, and access period. Share the email and password with the customer through a secure channel. The app does not send invitation email automatically.
5. The customer signs in online once with their email and password. This activates device-local offline sign-in. Later, offline sign-in requires the same email and password; no license key is needed.

Offline sign-in is limited to seven days per online activation and never extends past the subscription end date. Customers must reconnect and sign in again to renew it. Offline POS data is stored separately per workspace and browser/device; it does not automatically sync to online reports, AI, WhatsApp, or website orders yet.
