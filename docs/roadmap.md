# Implementation roadmap

## Phase 1 — Foundation
- [x] Record product scope and safety boundaries.
- [x] Establish repository documentation.
- [ ] Create Next.js TypeScript application and shared design system.
- [ ] Add environment validation and health endpoint.
- [ ] Add automated lint, typecheck, and test commands.

## Phase 2 — Identity and persistence
- [ ] PostgreSQL schema and migrations.
- [ ] Owner authentication and role model.
- [ ] Audit event model and append-only audit service.
- [ ] Task, project, agent-run, and approval records.

## Phase 3 — Telegram command channel
- [ ] Official Telegram Bot API adapter and webhook.
- [ ] Owner Telegram ID allowlist.
- [ ] Text commands and status responses.
- [ ] Voice transcription pipeline.
- [ ] Integration tests using mocked Telegram updates.

## Phase 4 — Orchestration
- [ ] Durable queue and worker.
- [ ] AI provider abstraction.
- [ ] CEO task decomposition and specialist-agent registry.
- [ ] Retry, timeout, cancellation, and emergency stop.
- [ ] Approval gates for sensitive actions.

## Phase 5 — Dashboard and business workflows
- [ ] Live operational status backed by persisted data.
- [ ] CRM, opportunities, projects, documents, invoices, and finance reporting.
- [ ] Agent activity and approval center.
- [ ] Email and other integrations after authorization.

## Phase 6 — Production
- [ ] Configure secrets in hosting provider.
- [ ] Deploy staging and run end-to-end tests.
- [ ] Configure Telegram webhook over HTTPS.
- [ ] Verify monitoring, backups, access controls, and recovery.
- [ ] Production release only after acceptance tests pass.

## Acceptance rule

A feature is complete only when its implementation, tests, and observed result are recorded. A planned integration must never be described as connected until a real connectivity test succeeds.
