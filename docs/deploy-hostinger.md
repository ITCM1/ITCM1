# Deploy ITCM GLOBAL AI to Hostinger

This repository is a Next.js application. Deploy it as a **Node.js Web App**, not as a static website.

## Before starting

- Confirm the Hostinger plan supports Node.js Web Apps. Hostinger currently lists Business Web Hosting and Cloud plans for this feature; VPS also works but requires manual setup.
- Keep the existing website/email service safe. If ITCMFACTORY.COM currently hosts a live website or email, do not delete or replace it. Consider deploying first to a subdomain such as `app.itcmfactory.com`.
- Confirm the GitHub repository is the intended source and choose the `main` branch.

## Hostinger deployment

1. Sign in to Hostinger hPanel.
2. Open **Websites** and choose **Create site**.
3. Choose **Web App** / **Node.js Web App**.
4. Choose **Import Git Repository** and connect the GitHub account.
5. Select `ITCM1/ITCM1` and branch `main`.
6. Confirm the detected framework is **Next.js**.
7. Use the repository's build and start scripts:
   - Install: `npm install` (or the lockfile-matched clean install command if a lockfile exists)
   - Build: `npm run build`
   - Start: `npm run start`
8. Deploy and wait for the deployment dashboard to report success.
9. Open the temporary Hostinger URL and verify the dashboard and `/api/health`.

## Environment variables

Add these in Hostinger's **Environment Variables** page. Never commit actual values to GitHub.

- `APP_URL`: the final public HTTPS URL, e.g. `https://app.itcmfactory.com`
- `TELEGRAM_BOT_TOKEN`: token from BotFather
- `TELEGRAM_WEBHOOK_SECRET`: a random secret of at least 32 bytes
- `TELEGRAM_OWNER_USER_IDS`: the owner's numeric Telegram ID

After setting or changing variables, redeploy/restart as required by Hostinger.

## Domain and email safety

If using `ITCMFACTORY.COM`, first inspect current DNS records and any existing website/email configuration. Prefer a dedicated subdomain such as `app.itcmfactory.com` for the application. Do not change MX records; those may control business email delivery. Only update the specific DNS records Hostinger instructs for the app.

## Telegram activation

Only after the application has a working public HTTPS URL and the environment variables are saved, configure Telegram's webhook to:

`https://YOUR-APP-DOMAIN/api/telegram/webhook`

Use Telegram's `setWebhook` API from a trusted terminal or secure server-side setup. Do not paste the bot token into chat, GitHub, screenshots, or source code.

## Acceptance checks

- Hostinger deployment status is successful.
- `https://YOUR-APP-DOMAIN/api/health` returns JSON with service `itcm-global-ai`.
- Telegram `getWebhookInfo` reports the expected HTTPS webhook URL and no recent delivery error.
- Sending `/start` from the authorized owner account gets the webhook's setup response.
- Sending `/status` returns the honest current integration state.

The Telegram webhook currently provides only a secure connectivity/owner-authorization milestone. It is not yet the AI executive agent or a task-execution engine.
