# Deploy ITCM GLOBAL AI on Cloudflare Workers

The repository uses the OpenNext Cloudflare adapter. A successful GitHub build does not prove that the Worker is deployed or that external bindings are configured.

## Connect GitHub to Cloudflare

1. Sign in at https://dash.cloudflare.com/.
2. Open **Workers & Pages** and create an application by importing **ITCM1/ITCM1**.
3. Select the `main` branch and repository root.
4. Use build command `npm run build` and deploy command `npx wrangler deploy`.
5. Use Worker name `itcm1`. Do not select a static Pages preset.

## Create and connect the D1 database

1. Create a D1 database named `itcm-global-ai` in Cloudflare Dashboard > Storage & databases > D1, or run:
   ```bash
   npx wrangler d1 create itcm-global-ai
   ```
2. In Workers & Pages > `itcm1` > Settings > Bindings, add a D1 database binding:
   - Variable name: `DB`
   - Database: `itcm-global-ai`
3. Copy the D1 `database_id` returned by Cloudflare and add a `d1_databases` entry to `wrangler.jsonc` with `binding: "DB"`, `database_name: "itcm-global-ai"`, and that real `database_id`. A commented template is already present in the file. Do not deploy with the placeholder ID.
4. Apply the schema to the remote database:
   ```bash
   npx wrangler d1 execute itcm-global-ai --remote --file=migrations/0001_tasks.sql
   npx wrangler d1 execute itcm-global-ai --remote --file=migrations/0002_orchestration.sql
   ```
5. Confirm the binding is present on the deployed Worker. Until this is done, task API operations return an explicit 503 configuration error.

## Configure secrets

Add these values under Worker > Settings > Variables and Secrets. Use encrypted secrets for credentials.

- `OWNER_LOGIN_PASSWORD`: a strong, unique owner password.
- `SESSION_SECRET`: a random secret with at least 32 bytes of entropy.
- `TELEGRAM_BOT_TOKEN`: token from Telegram BotFather.
- `TELEGRAM_WEBHOOK_SECRET`: a new random secret used to verify webhook requests.
- `TELEGRAM_OWNER_USER_IDS`: owner Telegram numeric ID `787937965`.
- `AI_PROVIDER` and `AI_API_KEY`: only when an AI provider has been selected and its API key is ready.

Never paste secrets into GitHub files, screenshots, or chat. For local development, use `.env.local` and a local D1 binding.

## Owner login and task management

- Open the deployed Worker URL.
- Sign in using `OWNER_LOGIN_PASSWORD`.
- The server issues a 12-hour HttpOnly, SameSite=Strict signed session cookie.
- Task read, create, update, and delete operations require the owner session and use the D1 `tasks` table.
- The dashboard displays a configuration error instead of pretending to save when D1 is missing.

## Telegram commands

After deployment, configure the bot webhook to:
```
https://itcm1.ufstwold.workers.dev/api/telegram/webhook
```
Use Telegram's official `setWebhook` method with the same secret token as `TELEGRAM_WEBHOOK_SECRET` (replace placeholders locally; never commit or share the bot token):
```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \\
  -d "url=https://itcm1.ufstwold.workers.dev/api/telegram/webhook" \\
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```
Keep the bot token private.

Owner-only commands currently implemented:
- `/start` or `/help`: show help.
- `/status`: report whether database and AI credentials are detected.
- `/tasks`: list the latest ten tasks from D1.
- `/task عنوان المهمة`: create a task in D1.
- `/done TASK_ID`: mark a task complete.

These Telegram task commands are real D1-backed operations when the database binding and migration are configured. They do not call an AI model, execute arbitrary commands, send customer messages, spend money, or perform financial transfers.

## Current implementation limits

- The D1 schema now includes projects, agent runs, approvals, and audit events (migration `0002_orchestration.sql`), but APIs, audit-writing services, approval workflows, and background execution are not implemented yet.
- No AI model is connected until `AI_PROVIDER`, `AI_API_KEY`, and a supported provider adapter are configured and tested.
- Email, WhatsApp, payment providers, marketplace integrations, and financial workflows are not connected.
- The GitHub CI workflow validates lint, TypeScript, and the Next.js production build. It does not validate Cloudflare credentials, D1 provisioning, Telegram webhook registration, or live production deployment.
- Do not treat a successful GitHub commit or CI run as proof of a Cloudflare deployment. Confirm the Workers deployment in Cloudflare and test the live URL.
