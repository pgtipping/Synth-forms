import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { getAuditLogs } from "@/lib/audit";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your account dashboard",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const { logs } = await getAuditLogs({
    userId: session?.user?.id,
    limit: 5,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Welcome back, {session?.user?.name}
        </h2>
        <p className="mt-1 text-gray-600">
          Here's what's happening with your account
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        <div className="mt-4 space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {log.action}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
