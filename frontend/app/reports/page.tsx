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
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { getToken } from "@/lib/auth";

interface Stats {
  total: number;
  success: number;
  failed: number;
  pending: number;
  running: number;
  updated: number;
  domains: number;
  activeScrapes: number;
}

interface Job {
  id: number;
  url: string;
  domain: string;
  pageType: string;
  status: string;
  selectorsUpdated: boolean;
  durationMs: number | null;
  error?: string;
  result?: Record<string, any>;
  createdAt: string;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<{ jobs: Job[]; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [rescraping, setRescraping] = useState<number | null>(null);

  const headers = { Authorization: `Bearer ${getToken()}` };

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), limit: "25" });
    if (filter) qs.set("domain", filter);
    if (statusFilter) qs.set("status", statusFilter);

    const [statsRes, jobsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/crawler/stats`, { headers }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/crawler/jobs?${qs}`, {
        headers,
      }),
    ]);
    const statsData = await statsRes.json();
    const jobsData = await jobsRes.json();
    setStats(statsData);
    setJobs(jobsData);
  }, [page, filter, statusFilter]);

  useEffect(() => {
    load();
    // Auto-refresh every 10s if there are active jobs
    const t = setInterval(() => {
      if (stats?.activeScrapes || stats?.pending || stats?.running) load();
    }, 10000);
    return () => clearInterval(t);
  }, [load]);

  const successRate =
    stats && stats.total > 0
      ? Math.round((stats.success / stats.total) * 100)
      : 0;

  const handleDelete = async (job: Job) => {
    if (!confirm(`Excluir job #${job.id} de "${job.domain}"?`)) return;
    setDeleting(job.id);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/crawler/jobs/${job.id}`, {
        method: "DELETE",
        headers,
      });
      load();
    } finally {
      setDeleting(null);
    }
  };

  const handleRescrape = async (job: Job) => {
    setRescraping(job.id);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/crawler/scrape`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ url: job.url }),
      });
      load();
    } finally {
      setRescraping(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Relatórios
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Histórico e métricas de todos os jobs de scraping.
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-all"
          title="Atualizar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Active jobs banner */}
      {stats && (stats.running > 0 || stats.pending > 0) && (
        <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-4 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
          <p className="text-sm text-violet-300">
            {stats.running > 0 && `${stats.running} job(s) em execução`}
            {stats.running > 0 && stats.pending > 0 && " · "}
            {stats.pending > 0 && `${stats.pending} na fila`}
            <span className="text-zinc-500 ml-2">
              — atualização automática ativa
            </span>
          </p>
        </div>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Sucesso" value={stats.success} color="emerald" />
          <StatCard label="Falhas" value={stats.failed} color="red" />
          <StatCard label="Em fila" value={stats.pending} color="violet" />
          <StatCard label="Executando" value={stats.running} color="violet" />
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
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Filtrar por domínio..."
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              className="text-sm rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all w-full sm:w-44"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-sm rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            >
              <option value="">Todos</option>
              <option value="success">Sucesso</option>
              <option value="failed">Falha</option>
              <option value="running">Executando</option>
              <option value="pending">Na fila</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Tipo
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
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {jobs?.jobs.map((job) => (
                <>
                  <tr
                    key={job.id}
                    className="hover:bg-zinc-800/40 transition-colors duration-100"
                  >
                    <td className="px-4 py-3.5 max-w-xs">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
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
                      <span className="text-xs text-zinc-500 font-mono">
                        {job.pageType || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        status={job.status}
                        selectorsUpdated={job.selectorsUpdated}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right text-zinc-500 text-xs tabular-nums">
                      {job.durationMs != null
                        ? `${(job.durationMs / 1000).toFixed(1)}s`
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right text-zinc-500 text-xs tabular-nums">
                      {new Date(job.createdAt).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {/* Re-scrape: enqueue new job with same URL */}
                        <button
                          title="Re-raspar com IA"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRescrape(job);
                          }}
                          disabled={
                            rescraping === job.id ||
                            job.status === "running" ||
                            job.status === "pending"
                          }
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {rescraping === job.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {/* Delete job */}
                        <button
                          title="Excluir registro"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(job);
                          }}
                          disabled={
                            deleting === job.id ||
                            job.status === "running" ||
                            job.status === "pending"
                          }
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {deleting === job.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {/* Expand toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(expanded === job.id ? null : job.id);
                          }}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
                        >
                          {expanded === job.id ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === job.id && job.result && (
                    <tr key={`${job.id}-detail`} className="bg-zinc-800/30">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {job.result.image && (
                            <div className="flex justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={job.result.image}
                                alt=""
                                className="max-h-40 object-contain rounded-xl border border-zinc-700 bg-zinc-900 p-2"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            {job.result.title && (
                              <p className="text-sm font-semibold text-zinc-100">
                                {job.result.title}
                              </p>
                            )}
                            {job.result.salePrice && (
                              <p className="text-lg font-bold text-emerald-400">
                                {job.result.salePrice}
                              </p>
                            )}
                            {job.result.originalPrice && (
                              <p className="text-sm text-zinc-500 line-through">
                                {job.result.originalPrice}
                              </p>
                            )}
                            {job.result.freeShipping && (
                              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg">
                                Frete grátis
                              </span>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <pre className="text-xs text-zinc-400 bg-zinc-900 rounded-xl p-3 overflow-x-auto border border-zinc-700">
                              {JSON.stringify(job.result, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {jobs?.jobs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-zinc-600 text-sm"
                  >
                    Nenhum job encontrado.
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

function StatusBadge({
  status,
  selectorsUpdated,
}: {
  status: string;
  selectorsUpdated: boolean;
}) {
  const map: Record<
    string,
    { cls: string; icon: React.ReactNode; label: string }
  > = {
    success: {
      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: "Sucesso",
    },
    failed: {
      cls: "bg-red-500/10 text-red-400 border-red-500/25",
      icon: <XCircle className="w-3 h-3" />,
      label: "Falha",
    },
    running: {
      cls: "bg-violet-500/10 text-violet-400 border-violet-500/25",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      label: "Executando",
    },
    pending: {
      cls: "bg-zinc-700/50 text-zinc-400 border-zinc-600",
      icon: <Clock className="w-3 h-3" />,
      label: "Na fila",
    },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg font-medium border ${s.cls}`}
    >
      {s.icon}
      {s.label}
      {selectorsUpdated && <RefreshCw className="w-3 h-3 text-amber-400" />}
    </span>
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
