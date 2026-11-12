# Deploy ITCM GLOBAL AI on Cloudflare Workers

The repository uses the OpenNext Cloudflare adapter. A successful GitHub build does not prove that the Worker is deployed or that external bindings are configured.

## Connect GitHub to Cloudflare

1. Sign in at https://dash.cloudflare.com/.
2. Open **Workers & Pages** and import **ITCM1/ITCM1**.
3. Select the `main` branch and repository root.
4. Use the OpenNext build command `npm run build:cloudflare` and deploy command `npx wrangler deploy`.
5. Use Worker name `itcm1`. Do not select a static Pages preset.

## Create and connect the D1 database

1. Use the D1 database named `tcm-global-ai` already declared in `wrangler.jsonc` (database ID `79575ae5-2083-4eb5-987f-ffd9079280ec`). Do not create a second database unless you also update the Worker binding and migration target.
2. In Workers & Pages > `itcm1` > Settings > Bindings, add a D1 binding:
   - Variable name: `DB`
   - Database: `tcm-global-ai`
3. Confirm `wrangler.jsonc` contains the real database ID and `DB` binding.
4. Apply all migrations:
   ```bash
   npm run db:migrate:remote
   npm run db:list:remote
   ```
5. Confirm the Worker has the binding. Task and agent APIs return an explicit configuration error if it is missing.

## Configure encrypted Worker secrets

In Worker > Settings > Variables and Secrets, configure the following. Do not put credentials in source files or chat.

- `OWNER_LOGIN_PASSWORD`: strong owner password.
- `SESSION_SECRET`: random secret with at least 32 bytes of entropy.
- `AI_API_KEY`: API key for the chosen OpenAI-compatible provider.
- `AI_MODEL`: model identifier supported by that provider.
- `AI_BASE_URL`: optional API base URL; defaults to `https://api.openai.com/v1`.
- `AGENT_QUEUE_SECRET`: strong random secret; set it both as an encrypted Worker secret and as a GitHub Actions repository secret with the same value.
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, and `TELEGRAM_OWNER_USER_IDS`: required only for Telegram bot operation.

The agent executor uses the OpenAI-compatible `/chat/completions` endpoint. Agent runs are first stored as queued records in D1. The scheduled GitHub Actions workflow calls the protected `/api/agent-queue/dispatch` endpoint every five minutes and processes at most one run per invocation. Failed runs are retried up to three attempts with increasing delays; abandoned running leases can be reclaimed after 90 seconds. It produces analysis, plans, drafts, and recommendations only. It has no tools for sending messages, publishing content, executing shell commands, or making payments. Missing AI configuration produces an explicit `AI_PROVIDER_NOT_CONFIGURED` failure rather than a fake success.

## Owner login and task management

- Open the deployed Worker URL and sign in with `OWNER_LOGIN_PASSWORD`.
- The server issues a signed, expiring HttpOnly session cookie.
- Task and agent-run APIs require owner authentication and D1.
- The dashboard/API must report configuration errors instead of pretending to save data.

## Telegram

After deployment, configure the Telegram webhook at:

```
https://itcm1.ufstwold.workers.dev/api/telegram/webhook
```

Use Telegram's official `setWebhook` method with the configured secret token. Keep the bot token private.

Telegram task commands are limited to the implemented D1-backed operations. They do not execute arbitrary commands or perform financial actions.

## Current implementation limits

- The D1-backed queue and retry scheduling are implemented. The GitHub Actions schedule must be enabled and `AGENT_QUEUE_SECRET` configured for automatic dispatch. It processes at most one job per five-minute schedule; this is a basic queue runner, not high-throughput orchestration. Cancellation and multi-agent delegation remain future work.
- The approval API records owner decisions, but the current text-only AI executor does not initiate external actions requiring approval.
- Email, WhatsApp, payment providers, and marketplace integrations are not connected.
- CI verifies code and build steps only. Confirm the Worker deployment in Cloudflare and test the live URL before treating the service as production-ready.
