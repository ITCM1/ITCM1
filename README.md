# ITCM GLOBAL AI

**Owner:** Taghi Benchraka  
**Product:** Autonomous business command center  
**Repository:** ITCM1/ITCM1

ITCM GLOBAL AI is being built as a secure, multilingual business operations platform. Telegram is the intended owner command channel; a web dashboard provides configuration, visibility, audit history, and approvals.

## Product principles

- Real integrations and persisted records; no fake dashboard metrics or demo-success claims.
- Owner-only access for executive commands.
- Human approval required for contracts, signatures, transfers, refunds, advertising spend, bank changes, and other legally or financially binding actions.
- Agents operate only through documented permissions, approved APIs, and auditable workflows.
- Emergency stop and durable audit logs are mandatory.

## Planned architecture

- Web application: Next.js + TypeScript.
- API and orchestration: server-side application services.
- Data: PostgreSQL + Prisma.
- Background execution: durable job queue and worker.
- Messaging: official Telegram Bot API (webhook).
- AI: provider abstraction; API credentials configured server-side.
- Deployment: production hosting selected after environment inspection.

## Current status

This repository contains the initial project specification and implementation plan. Telegram is **not connected**, no bot token is configured, and no production deployment has been performed yet.

See [docs/architecture.md](docs/architecture.md) and [docs/roadmap.md](docs/roadmap.md).
