# Implementation roadmap

## Current verified baseline
- [x] Next.js TypeScript application builds in CI.
- [x] ESLint and TypeScript checks pass in CI.
- [x] Owner password login and signed HttpOnly session cookie are implemented in code.
- [x] Owner-authenticated task API is implemented in code.
- [x] Telegram webhook command handler is implemented in code.
- [x] D1 migration for tasks exists.
- [x] D1 schema for projects, agent runs, approvals, and audit events added in `0002_orchestration.sql`.
- [ ] Cloudflare D1 database is not yet provisioned/bound to this Worker.
- [ ] Migrations have not yet been applied to a live D1 database.
- [ ] Telegram webhook and secrets have not yet been configured and connectivity-tested.
- [ ] AI provider is not yet configured; no agent is executing AI work.
- [ ] Cloudflare production deployment has not yet been verified.

## Phase 1 — Runtime foundation
- [x] Next.js TypeScript application and shared design baseline.
- [x] Environment-aware runtime configuration helper.
- [x] Health endpoint reports configured integration presence.
- [x] Automated CI lint, typecheck, and Next.js production build.
- [ ] Add automated unit and integration tests beyond static checks.

## Phase 2 — Identity and persistence
- [x] Owner authentication and signed session.
- [x] Owner-authenticated task records and API.
- [x] D1 schema for tasks, projects, agent runs, approvals, and audit events.
- [ ] Provision D1, add the real binding ID, and apply migrations 0001 and 0002.
- [ ] Add append-only audit event service and role model.
- [ ] Add project, agent-run, and approval APIs with authorization tests.

## Phase 3 — Telegram command channel
- [x] Webhook handler with Telegram secret-token validation.
- [x] Owner Telegram ID allowlist.
- [x] Text commands for help, status, listing tasks, creating tasks, and completing tasks.
- [ ] Configure secrets and webhook in Cloudflare.
- [ ] Add integration tests using mocked Telegram updates.
- [ ] Add voice transcription only after selecting and configuring a provider.

## Phase 4 — Orchestration
- [ ] Configure an AI provider abstraction using server-side secrets.
- [ ] Implement a planning-only orchestrator and structured plan validation.
- [ ] Add specialist-agent registry and bounded task execution.
- [ ] Add durable queue, retries, timeouts, cancellation, and emergency stop.
- [ ] Enforce owner approval for payments, transfers, refunds, ad spend, contracts, account changes, and external bulk communications.
- [ ] Persist agent runs, decisions, and audit events.

## Phase 5 — Dashboard and business workflows
- [ ] Live operational status backed by persisted data.
- [ ] CRM, opportunities, projects, documents, invoices, and finance reporting.
- [ ] Agent activity and approval center.
- [ ] Email and other integrations after explicit authorization and connectivity tests.

## Phase 6 — Production
- [ ] Configure secrets in hosting provider.
- [ ] Deploy staging and run end-to-end tests.
- [ ] Configure Telegram webhook over HTTPS.
- [ ] Verify monitoring, backups, access controls, and recovery.
- [ ] Production release only after acceptance tests pass.

## Acceptance rule
A feature is complete only when its implementation, tests, and observed result are recorded. A planned integration must never be described as connected until a real connectivity test succeeds.
