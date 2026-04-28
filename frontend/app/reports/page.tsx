"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import { getToken } from "@/lib/auth";

interface Stats {
  total: number;
  success: number;
  failed: number;
  updated: number;
  domains: number;
}

interface Job {
  id: number;
  url: string;
  domain: string;
  status: string;
  selectorsUpdated: boolean;
  durationMs: number;
  error?: string;
  createdAt: string;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<{ jobs: Job[]; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");

  const token = `Bearer ${getToken()}`;
  const headers = { Authorization: token };

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), limit: "25" });
    if (filter) qs.set("domain", filter);

    const [statsRes, jobsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/crawler/stats`, { headers }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/crawler/jobs?${qs}`, {
        headers,
      }),
    ]);
    setStats(await statsRes.json());
    setJobs(await jobsRes.json());
  }, [page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const successRate =
    stats && stats.total > 0
      ? Math.round((stats.success / stats.total) * 100)
      : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Relatórios
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Histórico e métricas de todos os jobs de scraping.
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Sucesso" value={stats.success} color="emerald" />
          <StatCard label="Falhas" value={stats.failed} color="red" />
          <StatCard
            label="Sel. atualizados"
            value={stats.updated}
            color="amber"
          />
          <StatCard label="Domínios" value={stats.domains} color="violet" />
        </div>
      )}

      {/* Success rate */}
      {stats && stats.total > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-300">
                Taxa de sucesso
              </span>
            </div>
            <span
              className={`text-sm font-bold ${successRate >= 80 ? "text-emerald-400" : successRate >= 50 ? "text-amber-400" : "text-red-400"}`}
            >
              {successRate}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${successRate >= 80 ? "bg-emerald-500" : successRate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${successRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-600 mt-1.5">
            <span>{stats.success} sucessos</span>
            <span>{stats.failed} falhas</span>
          </div>
        </div>
      )}

      {/* Jobs table */}
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h2 className="text-base font-semibold text-zinc-200">
            Histórico de jobs
          </h2>
          <input
            type="text"
            placeholder="Filtrar por domínio..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="text-sm rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all w-full sm:w-52"
          />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Duração
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {jobs?.jobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-zinc-800/40 transition-colors duration-100"
                >
                  <td className="px-4 py-3.5 max-w-xs">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors group"
                    >
                      <span className="truncate text-xs">{job.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    {job.error && (
                      <p className="text-xs text-red-500 mt-1 truncate">
                        {job.error}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg font-medium border ${
                        job.status === "success"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                          : "bg-red-500/10 text-red-400 border-red-500/25"
                      }`}
                    >
                      {job.status === "success" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {job.status}
                      {job.selectorsUpdated && (
                        <RefreshCw className="w-3 h-3 text-amber-400 ml-0.5" />
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-zinc-500 text-xs tabular-nums">
                    {job.durationMs.toLocaleString()} ms
                  </td>
                  <td className="px-4 py-3.5 text-right text-zinc-500 text-xs tabular-nums">
                    {new Date(job.createdAt).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
              {jobs?.jobs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-zinc-600 text-sm"
                  >
                    Nenhum job ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {jobs && jobs.total > 25 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500">
              <span>{jobs.total} jobs</span>
              <div className="flex gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={page * 25 >= jobs.total}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: "emerald" | "red" | "amber" | "violet";
}) {
  const colorMap = {
    emerald: "text-emerald-400",
    red: "text-red-400",
    amber: "text-amber-400",
    violet: "text-violet-400",
  };
  const valueColor = color ? colorMap[color] : "text-zinc-100";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium mb-1.5">
        {label}
      </p>
      <p className={`text-2xl font-bold tabular-nums ${valueColor}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
