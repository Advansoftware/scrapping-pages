"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { getToken } from "@/lib/auth";

interface Config {
  domain: string;
  version: number;
  failCount: number;
  lastTestedAt: string | null;
  updatedAt: string;
  selectors: Record<string, string | null>;
}

interface ConfigsResponse {
  configs: Config[];
  total: number;
  page: number;
  limit: number;
}

export default function ConfigsPage() {
  const [data, setData] = useState<ConfigsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Config | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/crawler/configs?page=${page}&limit=20`,
      { headers: { Authorization: `Bearer ${getToken()}` } },
    );
    setData(await res.json());
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (domain: string) => {
    if (!confirm(`Remover seletores de "${domain}"?`)) return;
    setDeleting(domain);
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/crawler/configs/${encodeURIComponent(domain)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );
    setDeleting(null);
    if (selected?.domain === domain) setSelected(null);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Configurações de domínios
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">
          Seletores CSS gerados por IA e salvos por domínio. Deletar um registro
          força a IA a regenerar na próxima raspagem.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Table */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {data?.total ?? 0} domínios
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Domínio
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Ver
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Falhas
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {data?.configs.map((c) => (
                <tr
                  key={c.domain}
                  className={`cursor-pointer transition-colors duration-100 ${
                    selected?.domain === c.domain
                      ? "bg-violet-500/10 border-l-2 border-l-violet-500"
                      : "hover:bg-zinc-800/50"
                  }`}
                  onClick={() => setSelected(c)}
                >
                  <td className="px-4 py-3 font-medium text-zinc-200">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      <span className="truncate max-w-[160px]">{c.domain}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-500 text-xs">
                    v{c.version}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.failCount > 0
                          ? "bg-red-500/15 text-red-400 border border-red-500/25"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                      }`}
                    >
                      {c.failCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.domain);
                      }}
                      disabled={deleting === c.domain}
                      className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-150 disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {data?.configs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-zinc-600 text-sm"
                  >
                    Nenhum domínio ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.total > data.limit && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500">
              <span>{data.total} domínios</span>
              <div className="flex gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={page * data.limit >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selector detail */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          {selected ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start pb-3 border-b border-zinc-800">
                <h2 className="font-semibold text-zinc-100">
                  {selected.domain}
                </h2>
                <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-lg">
                  v{selected.version}
                </span>
              </div>
              <div className="space-y-2.5">
                {Object.entries(selected.selectors).map(([field, selector]) => (
                  <div key={field} className="flex gap-3 text-sm">
                    <span className="w-28 shrink-0 text-zinc-500 font-medium text-xs pt-0.5 uppercase tracking-wide">
                      {field}
                    </span>
                    <code className="text-violet-400 break-all text-xs leading-relaxed font-mono">
                      {selector || (
                        <span className="text-zinc-700 italic">vazio</span>
                      )}
                    </code>
                  </div>
                ))}
              </div>
              {selected.lastTestedAt && (
                <p className="text-xs text-zinc-600 pt-3 border-t border-zinc-800">
                  Último teste:{" "}
                  {new Date(selected.lastTestedAt).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Globe className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-zinc-600 text-sm">
                Clique em um domínio para ver seus seletores
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

