# Hosting Guide: Free PostgreSQL + Render (Backend) + Vercel (Frontend)

Follow these 4 steps to host **ollaiBooks** live on HTTPS with **zero `localhost`** so you can share the web app, Windows `.exe`, macOS `.dmg`, and Android `.apk` with anyone.

---

## Step 1: Create a Free PostgreSQL Database (Neon)

> **Tip:** Render's free PostgreSQL expires after 30 days. **Neon (`https://neon.tech`)** gives a permanent free PostgreSQL database.

1. Sign up at **https://neon.tech** (free tier).
2. Create a new project (e.g. `ollaibooks-db`, region closest to India/users such as Singapore).
3. Copy the **Connection String** (Pooled), which looks like:
   ```text
   postgresql://neondb_owner:PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

---

## Step 2: Host Backend API (`apps/api`) on Render (Free)

1. Push your repository to **GitHub**.
2. Go to **https://dashboard.render.com** → **New +** → **Web Service** → select your GitHub repo.
3. Configure:
   - **Name**: `ollaibooks-api`
   - **Root Directory**: `apps/api`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npx prisma db push && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run start:prod
     ```
4. Add these **Environment Variables** in Render (see `apps/api/.env.example`):

   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DISABLE_REDIS` | `true` *(required on free tier without Redis)* |
   | `DATABASE_URL` | Your Neon PostgreSQL URL from Step 1 |
   | `JWT_SECRET` | Random 32+ char secret |
   | `AK_ADMIN_SERVICE_KEY` | Random 32+ char secret |
   | `INTEGRATION_ENCRYPTION_KEY` | Random 64 hex characters (0-9, a-f) |
   | `FRONTEND_URL` | `https://your-app.vercel.app` *(update after Step 3)* |
   | `WEB_APP_URL` | `https://your-app.vercel.app` |
   | `CORS_ORIGINS` | `https://your-app.vercel.app` |
   | `ADMIN_ID` | `ollaibooks-admin` |
   | `ADMIN_PASSWORD` | Your strong admin password (8+ chars, letters + numbers) |
   | `PLATFORM_ADMIN_EMAIL` | Your admin email |
   | `PLATFORM_ADMIN_PASSWORD` | Your 16+ char admin password |

5. Deploy and copy your live Render API URL, e.g.:
   `https://ollaibooks-api.onrender.com`

---

## Step 3: Host Frontend (`apps/web`) on Vercel (Free)

1. Go to **https://vercel.com** → **Add New Project** → import the same GitHub repo.
2. Configure:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web`
3. Add **Environment Variables** in Vercel (see `apps/web/.env.example`):

   | Key | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://ollaibooks-api.onrender.com/api/v1` |
   | `NEXT_PUBLIC_ALLOW_WEB_OFFLINE` | `0` |

4. Click **Deploy**. Copy your Vercel URL (e.g. `https://ollaibooks.vercel.app`).
5. Go back to **Render → Environment** and set `FRONTEND_URL`, `WEB_APP_URL`, and `CORS_ORIGINS` to `https://ollaibooks.vercel.app` (and redeploy Render once).

---

## Step 4: Build Shareable Installers (Zero `localhost`)

### Windows / Mac Desktop App (`.exe` / `.dmg`)
```powershell
$env:POS_API_URL="https://ollaibooks-api.onrender.com/api/v1"
npm run build:win
```

### Android App (`.apk`)
Update `capacitor.config.json`:
```json
"server": {
  "url": "https://ollaibooks.vercel.app/offline-pos",
  "cleartext": false
}
```
Then run `npx cap sync android` and build the `.apk` in Android Studio.
