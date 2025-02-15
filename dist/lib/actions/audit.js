"use server";
import { createAuditLog } from "@/lib/audit";
export async function logAudit(input) {
    return createAuditLog(input);
}
