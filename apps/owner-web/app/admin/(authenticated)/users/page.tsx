"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { getAdminUsers, type AdminUserItem } from "@/src/services/admin.service";

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["admin", "platform-users", { role: roleFilter, search: searchTerm, page }],
    queryFn: () =>
      getAdminUsers({
        role: roleFilter === "ALL" ? undefined : roleFilter,
        search: searchTerm || undefined,
        page,
        limit: pageSize,
      }),
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Platform Users Directory
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Multi-tenant directory of gym owners, operational staff, and registered members.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-emerald-400" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by user name, phone, or email..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Gym Owners</option>
            <option value="STAFF">Staff Members</option>
            <option value="MEMBER">Gym Members</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Phone (Masked)</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Associated Gym</th>
                <th className="px-5 py-3.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                      <span>Loading user directory...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No platform users found matching your search.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={`${u.role}-${u.id}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white">{u.name}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          u.role === "OWNER"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : u.role === "STAFF"
                            ? "bg-sky-500/20 text-sky-400"
                            : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-200">
                      {u.maskedPhone || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">{u.email || "—"}</td>
                    <td className="px-4 py-3.5">
                      {u.gymId ? (
                        <Link
                          href={`/admin/gyms/${u.gymId}`}
                          className="font-semibold text-slate-200 hover:text-emerald-400"
                        >
                          {u.gymName || u.gymId}
                        </Link>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{users.length}</span> of{" "}
            <span className="font-semibold text-white">{total}</span> users
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-slate-300">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
              disabled={page >= (totalPages || 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
