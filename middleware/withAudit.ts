import { NextRequest, NextResponse } from "next/server";
import {
  createAuditLog,
  type AuditAction,
  type AuditEntityType,
  AUDIT_ENTITY_TYPES,
} from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export function withAudit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  action: AuditAction,
  entityType: AuditEntityType = AUDIT_ENTITY_TYPES.AUTH
) {
  return async (request: NextRequest) => {
    try {
      // Get audit information from headers
      const auditAction = (request.headers.get("x-audit-action") ||
        action) as AuditAction;
      const ipAddress =
        request.headers.get("x-audit-ip") || request.ip || "unknown";
      const userAgent =
        request.headers.get("x-audit-user-agent") ||
        request.headers.get("user-agent") ||
        "unknown";

      // Get user from session
      const token = await getToken({ req: request });

      // Create audit log
      await createAuditLog({
        action: auditAction,
        entityType,
        entityId: token?.sub || AUDIT_ENTITY_TYPES.SYSTEM,
        ipAddress,
        userAgent,
        metadata: {
          path: request.nextUrl.pathname,
          method: request.method,
          userId: token?.sub,
        },
      });

      return handler(request);
    } catch (error) {
      console.error("Audit error:", error);
      // Continue with request even if audit fails
      return handler(request);
    }
  };
}
