# Deploy ITCM GLOBAL AI on Cloudflare Workers (free plan)

The repository is configured for the OpenNext Cloudflare adapter. The app is not deployed until a successful Workers Build appears in Cloudflare.

## Connect the GitHub repository

1. Sign in at https://dash.cloudflare.com/.
2. Open **Workers & Pages**.
3. Choose **Create application** and then **Import a repository** (dashboard wording may vary).
4. Connect GitHub and grant Cloudflare access to **ITCM1/ITCM1**.
5. Select the `main` branch.

## Build configuration

- Worker name: `itcm1`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: `/` (repository root)
- Do not select a static Pages preset; this is a full-stack Next.js Worker.

## Secrets and variables

After deployment, add these as encrypted secrets / environment variables in Worker settings:

- `TELEGRAM_BOT_TOKEN` — token from BotFather (secret; never commit it).
- `TELEGRAM_WEBHOOK_SECRET` — a new random secret string chosen by the owner.
- `TELEGRAM_OWNER_USER_IDS` — `787937965`.

Never paste bot tokens into GitHub files, source code, screenshots, or chat.

## Persistent database and owner login

1. In Cloudflare, create a D1 database named `itcm-global-ai`.
2. Add a D1 binding named `DB` to Worker `itcm1`, pointing to that database.
3. Apply the SQL migration in `migrations/0001_tasks.sql` to the database (Cloudflare Dashboard > D1 > Console, or Wrangler migrations).
4. Add these encrypted Worker secrets:
   - `OWNER_LOGIN_PASSWORD` — a strong, unique owner password.
   - `SESSION_SECRET` — a random secret of at least 32 bytes.
5. For local development, set the same variables in `.env.local` and configure a local D1 binding.

The login endpoint is `/api/auth/login`; it issues a 12-hour HttpOnly, SameSite=Strict session cookie. Task read/write/delete endpoints require this owner session. Without the D1 binding and migration, task endpoints return an explicit configuration error; they do not silently claim to save data.

## Telegram webhook

After deployment, configure Telegram's webhook to `https://itcm1.<your-worker-domain>/api/telegram/webhook` with the same secret token. Keep the bot token and webhook secret private. Test these owner-only commands in the bot:

- `/start` or `/help` — show commands.
- `/status` — check whether database and AI credentials are detected.
- `/tasks` — list the latest ten tasks.
- `/task عنوان المهمة` — create a task in D1.
- `/done TASK_ID` — mark a task complete.

The webhook still does not call an AI model or execute arbitrary business operations.

## Current limitations

- Telegram supports owner-only task commands backed by D1, but it is not yet an autonomous AI agent.
- The task API and owner session endpoints are implemented, but they require the D1 binding, SQL migration, and owner secrets above before use.
- AI provider orchestration is not configured.
- A successful commit is not proof of a successful build or deployment. Confirm the Workers Build is green and test the deployed URL.
- Cloudflare's free plan has usage and runtime limits; review current limits before production use.
