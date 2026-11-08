import type { D1Database } from "@/lib/cloudflare";

type AuditEvent = {
  actorType: "owner" | "agent" | "system" | "integration";
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  outcome: "success" | "denied" | "failure" | "pending";
  details?: Record<string, unknown>;
  correlationId?: string | null;
};

/**
 * Persist an audit event without making the primary business operation fail
 * when the audit table is temporarily unavailable.
 */
export async function writeAuditEvent(db: D1Database, event: AuditEvent): Promise<boolean> {
  try {
    await db.prepare(
      "INSERT INTO audit_events (id, actor_type, actor_id, action, resource_type, resource_id, outcome, details_json, correlation_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      crypto.randomUUID(),
      event.actorType,
      event.actorId,
      event.action,
      event.resourceType,
      event.resourceId ?? null,
      event.outcome,
      JSON.stringify(event.details ?? {}),
      event.correlationId ?? null,
      new Date().toISOString()
    ).run();
    return true;
  } catch {
    return false;
  }
}
