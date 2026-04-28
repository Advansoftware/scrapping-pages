"use client";

import { useState, useRef, useCallback } from "react";
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { getToken } from "@/lib/auth";

interface ProductData {
  title: string | null;
  salePrice: string | null;
  originalPrice: string | null;
  image: string | null;
  hasCoupon: boolean;
  couponText: string | null;
  freeShipping: boolean;
  shippingText: string | null;
  hasPixPrice: boolean;
  installments: { times: string; value: string } | null;
}

interface JobResult {
  id: number;
  status: "pending" | "running" | "success" | "failed";
  result?: ProductData;
  error?: string;
  domain?: string;
  pageType?: string;
  selectorsUpdated?: boolean;
  durationMs?: number;
  url?: string;
}

type UIState =
  | { phase: "idle" }
  | { phase: "queued"; jobId: number; elapsed: number }
  | { phase: "running"; jobId: number; elapsed: number }
  | { phase: "done"; job: JobResult };

const STATUS_LABEL: Record<string, string> = {
  pending: "Na fila...",
  running: "Raspando página...",
};

export default function DashboardPage() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<UIState>({ phase: "idle" });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };

  const stopTimers = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);
  };

  const startPolling = useCallback((jobId: number) => {
    startRef.current = Date.now();

    // Elapsed time ticker
    elapsedRef.current = setInterval(() => {
      const secs = Math.round((Date.now() - startRef.current) / 1000);
      setState((s) =>
        s.phase === "queued" || s.phase === "running"
          ? { ...s, elapsed: secs }
          : s,
      );
    }, 1000);

    // Status poller
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/crawler/jobs/${jobId}`,
          { headers: { Authorization: `Bearer ${getToken()}` } },
        );
        const job: JobResult = await res.json();

        if (job.status === "running") {
          setState({
            phase: "running",
            jobId,
            elapsed: Math.round((Date.now() - startRef.current) / 1000),
          });
        }

        if (job.status === "success" || job.status === "failed") {
          stopTimers();
          setState({ phase: "done", job });
        }
      } catch {
        // keep polling
      }
    }, 3000);
  }, []);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    stopTimers();

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/crawler/scrape`,
        { method: "POST", headers: authHeaders, body: JSON.stringify({ url }) },
      );
      const json = await res.json();
      if (!res.ok) {
        setState({
          phase: "done",
          job: {
            id: 0,
            status: "failed",
            error: json.message ?? "Erro desconhecido",
          },
        });
        return;
      }
      setState({ phase: "queued", jobId: json.jobId, elapsed: 0 });
      startPolling(json.jobId);
    } catch {
      setState({
        phase: "done",
        job: { id: 0, status: "failed", error: "Erro de conexão com a API" },
      });
    }
  };

  const isLoading = state.phase === "queued" || state.phase === "running";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Scraping
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">
          Cole qualquer URL de produto. O sistema detecta o domínio e tipo de
          página automaticamente. IA é usada apenas na primeira visita a um novo
          template.
        </p>
      </div>

      {/* URL form */}
      <form onSubmit={handleScrape} className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="url"
            placeholder="https://www.amazon.com.br/dp/B09G9BL5CP"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all duration-150 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 shadow-lg shadow-violet-900/25 whitespace-nowrap"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {isLoading ? "Processando..." : "Raspar"}
        </button>
      </form>

      {/* Processing status */}
      {(state.phase === "queued" || state.phase === "running") && (
        <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-violet-300">
                {STATUS_LABEL[state.phase === "queued" ? "pending" : "running"]}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Job #{state.jobId} · {state.elapsed}s decorridos
                {state.phase === "running" && (
                  <span className="ml-2 text-violet-400">
                    A IA pode levar alguns minutos na primeira visita.
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <Clock className="w-3.5 h-3.5" />
              <span className="tabular-nums">{state.elapsed}s</span>
            </div>
          </div>

          {/* Animated progress bar */}
          <div className="mt-4 h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-1000"
              style={{
                width:
                  state.phase === "queued"
                    ? "15%"
                    : `${Math.min(90, 15 + state.elapsed * 0.8)}%`,
                animation:
                  state.phase === "running" ? undefined : "pulse 2s infinite",
              }}
            />
          </div>
        </div>
      )}

      {/* Result */}
      {state.phase === "done" && (
        <div
          className={`rounded-2xl border p-6 ${
            state.job.status === "success"
              ? "border-emerald-500/25 bg-emerald-500/5"
              : "border-red-500/25 bg-red-500/5"
          }`}
        >
          {/* Result header */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              {state.job.status === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <span
                className={`text-sm font-semibold ${state.job.status === "success" ? "text-emerald-400" : "text-red-400"}`}
              >
                {state.job.status === "success"
                  ? "Scraping concluído"
                  : "Falha no scraping"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap justify-end">
              {state.job.domain && (
                <span className="px-2 py-1 bg-zinc-800 rounded-lg">
                  {state.job.domain}
                </span>
              )}
              {state.job.pageType && (
                <span className="px-2 py-1 bg-zinc-800 rounded-lg">
                  {state.job.pageType}
                </span>
              )}
              {state.job.durationMs != null && (
                <span className="px-2 py-1 bg-zinc-800 rounded-lg">
                  {(state.job.durationMs / 1000).toFixed(1)}s
                </span>
              )}
              {state.job.selectorsUpdated && (
                <span className="px-2 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-lg font-medium flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Seletores atualizados
                </span>
              )}
            </div>
          </div>

          {state.job.error && (
            <div className="flex items-start gap-2 text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">{state.job.error}</p>
            </div>
          )}

          {state.job.result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              {state.job.result.image && (
                <div className="flex justify-center items-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={state.job.result.image}
                    alt={state.job.result.title || "Produto"}
                    className="max-h-56 object-contain rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Fields */}
              <div className="space-y-3">
                <Field label="Título" value={state.job.result.title} />
                <Field
                  label="Preço promocional"
                  value={state.job.result.salePrice}
                  highlight
                />
                <Field
                  label="Preço original"
                  value={state.job.result.originalPrice}
                />
                {state.job.result.installments && (
                  <Field
                    label="Parcelamento"
                    value={`${state.job.result.installments.times}x de R$ ${state.job.result.installments.value}`}
                  />
                )}
                <Field
                  label="Frete"
                  value={
                    state.job.result.freeShipping
                      ? "✓ Grátis"
                      : state.job.result.shippingText || null
                  }
                />
                {state.job.result.hasCoupon && (
                  <Field label="Cupom" value={state.job.result.couponText} />
                )}
                {state.job.result.hasPixPrice && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-lg">
                    ✓ Tem preço PIX
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">
        {label}
      </span>
      <p
        className={`text-sm font-medium mt-0.5 ${highlight ? "text-emerald-400 text-base" : "text-zinc-100"}`}
      >
        {value}
      </p>
    </div>
  );
}

