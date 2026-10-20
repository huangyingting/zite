import { prisma } from "@/lib/prisma";

export type AuditCategory = "auth" | "user" | "db" | "app" | "workflow" | "ai" | "org";

const SECURITY_CRITICAL_EVENTS = new Set([
  "auth.login.success",
  "auth.login.failure",
  "auth.password.resetComplete",
  "auth.password.adminChange",
  "auth.session.deleteAll",
  "user.disable",
  "user.roleChange",
  "user.creditLimitChange",
  "db.base.delete",
  "org.requireMfa",
  "org.creditLimitDefaultChange",
  "api.key.regenerate",
]);

export interface RecordAuditParams {
  eventType: string;
  category?: AuditCategory;
  securityCritical?: boolean;
  actorUserId?: string | null;
  actorEmail?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  targetName?: string | null;
  outcome?: "SUCCESS" | "FAILURE";
  ipAddress?: string | null;
  payload?: Record<string, unknown>;
}

export async function recordAuditLog(params: RecordAuditParams) {
  const category =
    params.category ||
    ((params.eventType.split(".")[0] as AuditCategory) ?? "org");
  const securityCritical =
    params.securityCritical ?? SECURITY_CRITICAL_EVENTS.has(params.eventType);

  try {
    return await prisma.auditLog.create({
      data: {
        eventType: params.eventType,
        category,
        securityCritical,
        actorUserId: params.actorUserId ?? null,
        actorEmail: params.actorEmail ?? "system@zite.com",
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        targetName: params.targetName ?? null,
        outcome: params.outcome ?? "SUCCESS",
        ipAddress: params.ipAddress ?? "127.0.0.1",
        payloadJson: JSON.stringify(params.payload ?? {}),
      },
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
    return null;
  }
}
