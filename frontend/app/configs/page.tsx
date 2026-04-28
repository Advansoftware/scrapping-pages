"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { getToken } from "@/lib/auth";

interface Config {
  id: number;
  domain: string;
  pageType: string;
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

interface PreviewResult {
  domain: string;
  pageType: string;
  selectors: Record<string, string>;
  result: {
    title: string | null;
    salePrice: string | null;
    originalPrice: string | null;
    image: string | null;
    hasCoupon: boolean;
    freeShipping: boolean;
    shippingText: string | null;
    hasPixPrice: boolean;
    installments: { times: string; value: string } | null;
  };
}

export default function ConfigsPage() {
  const [data, setData] = useState<ConfigsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Config | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  // Test/preview state
  const [testUrl, setTestUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<PreviewResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    if (!confirm(`Remover todos os seletores de "${domain}"?`)) return;
    setDeleting(domain);
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/crawler/configs/${encodeURIComponent(domain)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } },
    );
    setDeleting(null);
    if (selected?.domain === domain) setSelected(null);
    load();
  };

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl.trim() || !selected) return;
    setTesting(true);
    setTestResult(null);
    setTestError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/crawler/preview`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: testUrl }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setTestError(data.message || "Erro ao testar");
      } else {
        setTestResult(data);
      }
    } catch {
      setTestError("Erro de conexão");
    } finally {
      setTesting(false);
    }
  };

  const copySelectors = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(
      JSON.stringify(selected.selectors, null, 2),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Configurações de domínios
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">
          Seletores CSS gerados por IA. Cada domínio pode ter múltiplos tipos de
          página (produto, home, listagem). Deletar força a IA a regenerar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Table */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {data?.total ?? 0} configurações
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Domínio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Tipo
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
                  key={`${c.domain}-${c.pageType}`}
                  className={`cursor-pointer transition-colors duration-100 ${
                    selected?.domain === c.domain &&
                    selected?.pageType === c.pageType
                      ? "bg-violet-500/10 border-l-2 border-l-violet-500"
                      : "hover:bg-zinc-800/50"
                  }`}
                  onClick={() => {
                    setSelected(c);
                    setTestResult(null);
                    setTestError(null);
                    setTestUrl("");
                  }}
                >
                  <td className="px-4 py-3 font-medium text-zinc-200">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      <span className="truncate max-w-[140px] text-sm">
                        {c.domain}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                      {c.pageType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-500 text-xs">
                    v{c.version}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.failCount > 0 ? "bg-red-500/15 text-red-400 border border-red-500/25" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"}`}
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
                    colSpan={5}
                    className="px-4 py-12 text-center text-zinc-600 text-sm"
                  >
                    Nenhuma configuração ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {data && data.total > data.limit && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500">
              <span>{data.total} configs</span>
              <div className="flex gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={page * data.limit >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {selected ? (
            <>
              {/* Selectors card */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
                <div className="flex justify-between items-start pb-3 border-b border-zinc-800">
                  <div>
                    <h2 className="font-semibold text-zinc-100">
                      {selected.domain}
                    </h2>
                    <span className="text-xs text-zinc-500 font-mono">
                      {selected.pageType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copySelectors}
                      className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all"
                      title="Copiar JSON"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-lg">
                      v{selected.version}
                    </span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(selected.selectors).map(
                    ([field, selector]) => (
                      <div key={field} className="flex gap-3 text-sm">
                        <span className="w-24 shrink-0 text-zinc-500 font-medium text-xs pt-0.5 uppercase tracking-wide">
                          {field}
                        </span>
                        <code
                          className={`text-xs leading-relaxed font-mono break-all ${selector ? "text-violet-400" : "text-zinc-700 italic"}`}
                        >
                          {selector || "vazio"}
                        </code>
                      </div>
                    ),
                  )}
                </div>
                {selected.lastTestedAt && (
                  <p className="text-xs text-zinc-600 pt-3 border-t border-zinc-800">
                    Último teste:{" "}
                    {new Date(selected.lastTestedAt).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>

              {/* Test / Preview card */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
                <h3 className="font-semibold text-zinc-200 text-sm">
                  Testar seletores sem IA
                </h3>
                <p className="text-xs text-zinc-500">
                  Cole uma URL de {selected.domain} para verificar o que os
                  seletores salvos extraem. Nenhum job é criado.
                </p>
                <form onSubmit={handleTest} className="flex gap-2">
                  <input
                    type="url"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder={`https://${selected.domain}/...`}
                    required
                    disabled={testing}
                    className="flex-1 text-sm rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={testing}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white transition-all"
                  >
                    {testing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Testar
                  </button>
                </form>

                {testError && (
                  <div className="flex items-start gap-2 text-red-400 text-sm">
                    <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{testError}</span>
                  </div>
                )}

                {testResult && (
                  <div className="space-y-3 pt-2 border-t border-zinc-800">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Resultado (sem IA)
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {testResult.result.image && (
                        <div className="col-span-2 flex justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={testResult.result.image}
                            alt=""
                            className="max-h-32 object-contain rounded-xl border border-zinc-700 bg-zinc-900 p-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        </div>
                      )}
                      {testResult.result.title && (
                        <div className="col-span-2">
                          <p className="text-xs text-zinc-500 uppercase tracking-wide">
                            Título
                          </p>
                          <p className="text-sm text-zinc-100 mt-0.5">
                            {testResult.result.title}
                          </p>
                        </div>
                      )}
                      {testResult.result.salePrice && (
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wide">
                            Preço
                          </p>
                          <p className="text-base font-bold text-emerald-400 mt-0.5">
                            {testResult.result.salePrice}
                          </p>
                        </div>
                      )}
                      {testResult.result.freeShipping && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Frete grátis
                        </div>
                      )}
                    </div>
                    <pre className="text-xs text-zinc-400 bg-zinc-800/60 rounded-xl p-3 overflow-x-auto border border-zinc-700">
                      {JSON.stringify(testResult.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col items-center justify-center py-16 text-center">
              <Globe className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-zinc-600 text-sm">
                Clique em uma configuração para ver seletores e testar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

