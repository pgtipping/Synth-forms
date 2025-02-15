"use server";

import { createAuditLog } from "@/lib/audit";
import type { AuditLogInput } from "@/lib/audit";

export async function logAudit(input: AuditLogInput) {
  return createAuditLog(input);
}
