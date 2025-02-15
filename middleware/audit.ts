import { NextRequest, NextResponse } from "next/server";
import type { AuditAction } from "@/lib/audit";
import { AUDIT_ENTITY_TYPES } from "@/lib/audit";
import { logAudit } from "@/lib/actions/audit";

export function getClientIp(request: NextRequest): string {
  // Check for forwarded IP from proxy/load balancer
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Get first IP if multiple are present
    return forwardedFor.split(",")[0].trim();
  }

  // Check for real IP header (common with nginx)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to direct IP
  const remoteAddr = request.headers.get("remote-addr");
  if (remoteAddr) {
    return remoteAddr;
  }

  // Final fallback
  return request.headers.get("x-forwarded-for")?.split(",")[0] || "0.0.0.0";
}

const AUDITABLE_ROUTES = {
  "/api/auth": AUDIT_ENTITY_TYPES.AUTH,
  "/api/templates": AUDIT_ENTITY_TYPES.TEMPLATE,
  "/api/forms": AUDIT_ENTITY_TYPES.FORM,
  "/api/users": AUDIT_ENTITY_TYPES.USER,
} as const;

function determineEntityType(pathname: string) {
  const matchedRoute = Object.entries(AUDITABLE_ROUTES).find(([route]) =>
    pathname.startsWith(route)
  );
  return matchedRoute ? matchedRoute[1] : AUDIT_ENTITY_TYPES.SYSTEM;
}

function determineAction(method: string, pathname: string): AuditAction {
  const actionMap: Record<string, AuditAction> = {
    GET: "TEMPLATE_PREVIEW",
    POST: pathname.includes("submit") ? "FORM_SUBMIT" : "TEMPLATE_CREATE",
    PUT: "TEMPLATE_UPDATE",
    PATCH: "TEMPLATE_UPDATE",
    DELETE: "TEMPLATE_DELETE",
  };

  return actionMap[method] || ("SYSTEM_ERROR" as AuditAction);
}

export async function auditMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route should be audited
  if (
    Object.keys(AUDITABLE_ROUTES).some((route) => pathname.startsWith(route))
  ) {
    const entityType = determineEntityType(pathname);
    const action = determineAction(request.method, pathname);

    try {
      await logAudit({
        action,
        entityType,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent") || "unknown",
        metadata: {
          path: pathname,
          method: request.method,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }

  return NextResponse.next();
}

export async function authAuditMiddleware(
  request: NextRequest,
  action: AuditAction
) {
  try {
    await logAudit({
      action,
      entityType: AUDIT_ENTITY_TYPES.AUTH,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: {
        path: request.nextUrl.pathname,
        method: request.method,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to create auth audit log:", error);
  }

  return NextResponse.next();
}
