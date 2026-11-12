# ITCM GLOBAL AI

**Owner:** ITCM  
**Product:** Secure business operations command center  
**Repository:** ITCM1/ITCM1

ITCM GLOBAL AI is a secure business operations platform in active development. The web dashboard is the owner workspace, with Telegram as a limited owner command channel.

## Implemented

- Next.js + TypeScript owner dashboard.
- Owner password login with signed, expiring, HttpOnly session cookies.
- Owner-authenticated task API: create, list, update, and delete.
- Cloudflare D1 schema for tasks, projects, agent runs, approvals, audit events, and a durable agent queue.
- Owner-authenticated agent-run API that enqueues work in D1; an authenticated dispatcher claims jobs, executes the OpenAI-compatible chat-completions request, and records outcomes.
- Agent execution records success/failure, provider/model, output, and audit events in D1.
- Agent runs are limited to analysis, plans, drafts, and recommendations; they cannot perform external actions or move money.
- Telegram owner verification and D1-backed task commands.
- GitHub Actions CI validates lint, TypeScript, Next.js, and Cloudflare OpenNext builds.

## Required setup

- Cloudflare D1 database bound to the Worker as `DB`.
- Apply migrations `0001_tasks.sql`, `0002_orchestration.sql`, and `0003_agent_queue.sql`.
- Worker secrets `OWNER_LOGIN_PASSWORD`, `SESSION_SECRET`, and `AGENT_QUEUE_SECRET`.
- To enable AI agent execution, configure `AI_API_KEY` and `AI_MODEL`; optionally set `AI_BASE_URL` for an OpenAI-compatible provider. The default base URL is `https://api.openai.com/v1`.
- Add the same `AGENT_QUEUE_SECRET` value as a GitHub Actions repository secret so the scheduled queue workflow can call the protected dispatcher.
- Telegram secrets and owner allowlist must be configured for Telegram operations.

See [Cloudflare deployment and setup](docs/cloudflare-deploy.md). Without required external bindings and secrets, endpoints return explicit configuration errors.

## Not yet implemented or connected

- Multi-agent delegation, cancellation, and high-throughput queue processing. The scheduled dispatcher currently processes at most one job every five minutes.
- Email and WhatsApp delivery.
- Stripe, Paddle, marketplace, and other payment integrations.
- Production Cloudflare deployment verification.

## Security principles

- Owner-only task and agent operations.
- Secrets stay in encrypted Worker secrets, never in source control or ordinary chat.
- Contracts, signatures, transfers, refunds, advertising spend, bank changes, and other legally or financially binding actions require explicit owner approval.
- The current AI executor produces text only. It does not send communications, publish content, execute commands, or perform financial actions.
- Never report a payment, sale, deployment, or external action as successful without confirmation from the relevant service.

## Validation

GitHub Actions validates code quality and production builds. It does not prove Cloudflare credentials, D1 provisioning, Telegram webhook registration, AI-provider credentials, or live production deployment.
