import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@/lib/audit";

export async function authAuditMiddleware(
  request: NextRequest,
  action: AuditAction
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-audit-action", action);
  requestHeaders.set("x-audit-ip", request.ip || "unknown");
  requestHeaders.set(
    "x-audit-user-agent",
    request.headers.get("user-agent") || "unknown"
  );

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
