# Architecture

## System boundary

The Telegram bot is a command interface, not the execution engine. Telegram updates are authenticated and passed to a server-side command service. The command service records the request, checks the sender against the owner allowlist, classifies intent, creates an auditable task, and dispatches permitted work to background workers.

## Core components

1. **Telegram adapter** — webhook validation, owner allowlist, text and voice update handling.
2. **Command service** — intent parsing, clarification, policy checks, idempotency, task creation.
3. **AI CEO orchestrator** — decomposes approved objectives and delegates bounded tasks.
4. **Specialist agents** — business research, recruitment, sales support, project coordination, development coordination, marketing, customer support, email drafting, finance reporting, legal-document drafting, and quality checks.
5. **Approval service** — pauses actions that require owner authorization.
6. **Worker and queue** — durable execution, retries, timeouts, cancellation, and dead-letter handling.
7. **Persistence** — users, tasks, projects, agent runs, approvals, integrations, audit events, and financial records.
8. **Web dashboard** — status, tasks, approvals, logs, configuration, and integration health.

## Security invariants

- Only explicitly allowlisted Telegram user IDs can issue owner commands.
- Secrets are stored in server-side environment/secret storage and never committed.
- No bot token, API key, password, or bank credential is accepted in ordinary chat.
- Contracts, signatures, transfers, refunds, ad spend, bank changes, and legally binding commitments require explicit owner approval.
- External communications follow provider terms, applicable law, and anti-spam requirements.
- Every consequential operation records actor, task, authorization, timestamps, outcome, and provider reference.
- A global emergency stop prevents new autonomous work and safely cancels cancellable jobs.

## Voice workflow

Telegram voice update -> download using bot token on the server -> speech-to-text provider -> transcript confirmation when confidence is low -> same command authorization and policy pipeline as text. Never bypass approval checks because a request came by voice.

## Integration status

Telegram, AI provider, database, queue, email, hosting, and payment integrations remain unconfigured until credentials and deployment environment are supplied through secure configuration.
