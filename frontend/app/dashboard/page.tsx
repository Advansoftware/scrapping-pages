"use client";

import { useState } from "react";
import { Search, Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";
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

interface ScrapeResult {
  success: boolean;
  data?: ProductData;
  error?: string;
  domain?: string;
  selectorsUpdated?: boolean;
  durationMs?: number;
}

export default function DashboardPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/crawler/scrape`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ url }),
        },
      );

      const json = await res.json();
      if (!res.ok) {
        setResult({
          success: false,
          error: json.message ?? "Erro desconhecido",
        });
      } else {
        setResult(json);
      }
    } catch {
      setResult({ success: false, error: "Erro de conexão com a API" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Testar Scraping
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">
          Cole qualquer URL de produto. O sistema detecta o domínio
          automaticamente e usa IA para gerar seletores CSS na primeira visita.
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
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all duration-150"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 shadow-lg shadow-violet-900/25 whitespace-nowrap"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {loading ? "Raspando..." : "Raspar"}
        </button>
      </form>

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 animate-pulse space-y-4">
          <div className="h-4 bg-zinc-800 rounded w-1/3" />
          <div className="h-4 bg-zinc-800 rounded w-2/3" />
          <div className="h-4 bg-zinc-800 rounded w-1/2" />
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div
          className={`rounded-2xl border p-6 ${
            result.success
              ? "border-emerald-500/25 bg-emerald-500/5"
              : "border-red-500/25 bg-red-500/5"
          }`}
        >
          {/* Result header */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <span
                className={`text-sm font-semibold ${result.success ? "text-emerald-400" : "text-red-400"}`}
              >
                {result.success ? "Sucesso" : "Erro"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              {result.domain && (
                <span className="px-2 py-1 bg-zinc-800 rounded-lg">
                  {result.domain}
                </span>
              )}
              {result.durationMs && (
                <span className="px-2 py-1 bg-zinc-800 rounded-lg">
                  {result.durationMs} ms
                </span>
              )}
              {result.selectorsUpdated && (
                <span className="px-2 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-lg font-medium">
                  ↻ Seletores atualizados
                </span>
              )}
            </div>
          </div>

          {result.error && (
            <p className="text-red-400 text-sm">{result.error}</p>
          )}

          {result.data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              {result.data.image && (
                <div className="flex justify-center items-start">
                  <img
                    src={result.data.image}
                    alt={result.data.title || "Produto"}
                    className="max-h-56 object-contain rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                  />
                </div>
              )}

              {/* Fields */}
              <div className="space-y-3">
                <Field label="Título" value={result.data.title} />
                <Field
                  label="Preço promocional"
                  value={result.data.salePrice}
                  highlight
                />
                <Field
                  label="Preço original"
                  value={result.data.originalPrice}
                />
                {result.data.installments && (
                  <Field
                    label="Parcelamento"
                    value={`${result.data.installments.times}x de R$ ${result.data.installments.value}`}
                  />
                )}
                <Field
                  label="Frete"
                  value={
                    result.data.freeShipping
                      ? "✓ Grátis"
                      : result.data.shippingText || "—"
                  }
                />
                {result.data.hasCoupon && (
                  <Field label="Cupom" value={result.data.couponText} />
                )}
                {result.data.hasPixPrice && (
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
