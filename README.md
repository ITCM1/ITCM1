# ITCM GLOBAL AI

**Owner:** ITCM  
**Product:** Secure business operations command center  
**Repository:** ITCM1/ITCM1

ITCM GLOBAL AI is being developed as a secure business operations platform. The web dashboard is the owner workspace, with Telegram as a limited owner command channel.

## Implemented

- Next.js + TypeScript owner dashboard.
- Owner password login with signed, expiring, HttpOnly session cookies.
- Owner-authenticated task API: create, list, update, and delete.
- Cloudflare D1 schema for durable task records.
- Runtime environment lookup for Cloudflare Worker secrets and bindings.
- Health endpoint reports whether expected integrations and the D1 binding are detected.
- Telegram owner verification and D1-backed commands: `/tasks`, `/task <title>`, and `/done <task-id>`, plus `/help` and `/status`.
- GitHub Actions CI validates lint, TypeScript, and the Next.js production build.

## Required setup

Task management and Telegram task commands require:
- Cloudflare D1 database bound to the Worker as `DB`.
- SQL migration `migrations/0001_tasks.sql` applied to the remote database.
- Worker secrets `OWNER_LOGIN_PASSWORD` and `SESSION_SECRET`.
- Telegram secrets `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, and owner ID variable `TELEGRAM_OWNER_USER_IDS`.

See [Cloudflare deployment and setup](docs/cloudflare-deploy.md). Without the external bindings and secrets, endpoints return explicit configuration errors instead of claiming that data was saved.

## Not yet implemented or connected

- AI provider adapter, master orchestrator, and autonomous agent execution.
- Durable background queue, agent run history, and approval workflow.
- Email and WhatsApp delivery.
- Stripe, Paddle, marketplace, and other payment integrations.
- Production Cloudflare deployment verification.

## Security principles

- Owner-only task and Telegram operations.
- Secrets stay in environment variables or encrypted Worker secrets, never in source control.
- Contracts, signatures, transfers, refunds, advertising spend, bank changes, and other legally or financially binding actions require explicit owner approval.
- Agent actions must be permission-scoped and auditable.
- Never report a payment, sale, deployment, or external action as successful without confirmation from the relevant service.

## Validation

GitHub Actions verifies lint, TypeScript, and the Next.js production build. It does not verify Cloudflare credentials, D1 provisioning, Telegram webhook registration, or live production deployment.
