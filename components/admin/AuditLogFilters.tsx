"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/audit";

export function AuditLogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
      <div>
        <label
          htmlFor="action"
          className="block text-sm font-medium text-gray-700"
        >
          Action
        </label>
        <select
          id="action"
          name="action"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          defaultValue={searchParams.get("action") || ""}
          onChange={(e) => {
            router.push("?" + createQueryString("action", e.target.value));
          }}
        >
          <option value="">All Actions</option>
          {AUDIT_ACTIONS.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="entityType"
          className="block text-sm font-medium text-gray-700"
        >
          Entity Type
        </label>
        <select
          id="entityType"
          name="entityType"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          defaultValue={searchParams.get("entityType") || ""}
          onChange={(e) => {
            router.push("?" + createQueryString("entityType", e.target.value));
          }}
        >
          <option value="">All Types</option>
          {Object.values(AUDIT_ENTITY_TYPES).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="startDate"
          className="block text-sm font-medium text-gray-700"
        >
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          defaultValue={searchParams.get("startDate") || ""}
          onChange={(e) => {
            router.push("?" + createQueryString("startDate", e.target.value));
          }}
        />
      </div>

      <div>
        <label
          htmlFor="endDate"
          className="block text-sm font-medium text-gray-700"
        >
          End Date
        </label>
        <input
          type="date"
          id="endDate"
          name="endDate"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          defaultValue={searchParams.get("endDate") || ""}
          onChange={(e) => {
            router.push("?" + createQueryString("endDate", e.target.value));
          }}
        />
      </div>
    </div>
  );
}
