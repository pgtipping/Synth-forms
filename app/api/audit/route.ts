import { NextRequest, NextResponse } from "next/server";
import {
  createAuditLog,
  type AuditAction,
  type AuditEntityType,
} from "@/lib/audit";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const headersList = request.headers;
    const action = headersList.get("x-audit-action") as AuditAction;
    const entityType = headersList.get(
      "x-audit-entity-type"
    ) as AuditEntityType;
    const ipAddress = headersList.get("x-audit-ip");
    const userAgent = headersList.get("x-audit-user-agent");

    if (!action || !entityType) {
      return NextResponse.json(
        { error: "Missing required audit information" },
        { status: 400 }
      );
    }

    const auditLog = await createAuditLog({
      action,
      entityType,
      ipAddress: ipAddress || "unknown",
      userAgent: userAgent || "unknown",
      metadata: {
        path: request.nextUrl.pathname,
        method: request.method,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true, auditLog });
  } catch (error) {
    console.error("Audit API Error:", error);
    return NextResponse.json(
      { error: "Failed to create audit log" },
      { status: 500 }
    );
  }
}
