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
- Build command: `npm run build:cloudflare`
- Deploy command: `npx wrangler deploy`
- Root directory: `/` (repository root)
- Do not select a static Pages preset; this is a full-stack Next.js Worker.

## Secrets and variables

After deployment, add these as encrypted secrets / environment variables in Worker settings:

- `TELEGRAM_BOT_TOKEN` — token from BotFather (secret; never commit it).
- `TELEGRAM_WEBHOOK_SECRET` — a new random secret string chosen by the owner.
- `TELEGRAM_OWNER_USER_IDS` — `787937965`.

Never paste bot tokens into GitHub files, source code, screenshots, or chat.

## Telegram webhook

After deployment, configure Telegram's webhook to the Worker URL and use the same secret token. Then test `/start` and `/status` in the bot.

## Current limitations

- Telegram webhook currently supports only `/start` and `/status`; it is not yet an autonomous AI agent.
- Database and AI provider are not configured.
- A successful commit is not proof of a successful build or deployment. Confirm the Workers Build is green and test the deployed URL.
- Cloudflare's free plan has usage and runtime limits; review current limits before production use.
