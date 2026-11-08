# ITCM GLOBAL AI

**Owner:** Taghi Benchraka  
**Product:** Secure business operations command center  
**Repository:** ITCM1/ITCM1

ITCM GLOBAL AI is being developed as a secure, multilingual business operations platform. The web dashboard is the owner workspace; Telegram is planned as an additional command channel.

## Implemented in the repository

- Next.js + TypeScript dashboard.
- Owner password login endpoint with a signed, HttpOnly session cookie.
- Owner-authenticated task API: create, list, update status/details, and delete.
- Cloudflare D1 schema migration for durable task records.
- Health endpoint reports whether expected integration variables and the D1 binding are present.
- GitHub Actions CI runs dependency installation, lint, TypeScript checks, and Next.js production build.

## Required setup before task management is operational

The task API requires a Cloudflare D1 database bound to the Worker as `DB`, with `migrations/0001_tasks.sql` applied. Owner login requires the encrypted Worker secrets `OWNER_LOGIN_PASSWORD` and `SESSION_SECRET`. See [Cloudflare deployment and setup](docs/cloudflare-deploy.md).

Without those external settings, the API returns explicit configuration errors; it does not claim that records have been saved.

## Not yet implemented or connected

- AI provider integration and autonomous agent execution.
- Durable background job queue and master orchestrator.
- Telegram task execution (current webhook supports only `/start` and `/status`).
- Email and WhatsApp delivery.
- Payment provider integrations and financial operations.
- Production Cloudflare deployment verification.

## Security principles

- Owner-only task operations.
- Secrets remain in environment variables / encrypted Worker secrets, never in source control.
- Contracts, signatures, transfers, refunds, advertising spend, bank changes, and other legally or financially binding actions must require explicit owner approval.
- Agent actions must be permission-scoped and auditable.
- Never report a payment, sale, deployment, or external action as successful without confirmation from the relevant service.

## Validation

The GitHub Actions workflow verifies lint, TypeScript, and the Next.js production build. It does not by itself verify Cloudflare D1 provisioning, OpenNext Worker deployment, Telegram webhook configuration, or live integrations.
