import { Metadata } from "next";
import { getAuditLogs } from "@/lib/audit";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { AuditLogFilters } from "@/components/admin/AuditLogFilters";
import { Protected } from "@/components/auth/Protected";
import { Pagination } from "@/components/common/Pagination";
import type { AuditAction, AuditEntityType } from "@/lib/audit";

export const metadata: Metadata = {
  title: "Audit Logs | Admin",
  description: "View and manage audit logs",
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 50;
  const userId = searchParams.userId;
  const action = searchParams.action as AuditAction | undefined;
  const entityType = searchParams.entityType as AuditEntityType | undefined;
  const startDate = searchParams.startDate
    ? new Date(searchParams.startDate)
    : undefined;
  const endDate = searchParams.endDate
    ? new Date(searchParams.endDate)
    : undefined;

  const { logs, total, pages } = await getAuditLogs({
    page,
    limit,
    userId,
    action,
    entityType,
    startDate,
    endDate,
  });

  return (
    <Protected>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Audit Logs</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all audit logs including user actions, system events,
              and more.
            </p>
          </div>
        </div>
        <AuditLogFilters />
        <AuditLogTable logs={logs} />
        <Pagination total={total} pages={pages} currentPage={page} />
      </div>
    </Protected>
  );
}
