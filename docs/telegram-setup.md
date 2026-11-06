# Telegram webhook setup

The Telegram webhook endpoint is `POST /api/telegram/webhook`.

## Required server-side environment variables

- `TELEGRAM_BOT_TOKEN`: token from BotFather. Store only in the hosting provider's secret/environment settings.
- `TELEGRAM_WEBHOOK_SECRET`: a random secret string (use at least 32 random bytes). Telegram sends it in the `X-Telegram-Bot-Api-Secret-Token` header.
- `TELEGRAM_OWNER_USER_IDS`: comma-separated numeric Telegram user IDs allowed to issue owner commands.
- `APP_URL`: public HTTPS base URL of the deployed app.

Never commit real tokens or secrets to GitHub and never paste them into source files or chat.

## Configure the webhook

After deployment and after setting the variables, call Telegram's setWebhook API from a trusted terminal or secure server-side setup script:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=$APP_URL/api/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

Check webhook status securely:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

Do not share command output if it contains credentials.

## Current scope

The first webhook milestone supports owner-only `/start` and `/status` responses. It is a connectivity and authorization test, not yet the AI executive agent. AI task execution, durable storage, queue workers, voice transcription, and business integrations are separate milestones.
