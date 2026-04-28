"use client";

import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth";

const PROVIDERS = [
  {
    id: "anthropic",
    label: "Anthropic",
    description: "Claude models. Melhor qualidade para páginas complexas.",
    models: [
      "claude-opus-4-5",
      "claude-sonnet-4-5",
      "claude-haiku-3-5",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
    ],
    keyPlaceholder: "sk-ant-api03-...",
    needsBaseUrl: false,
    defaultBaseUrl: "",
    freeTextModel: false,
  },
  {
    id: "openai",
    label: "OpenAI",
    description: "GPT models. Ótimo equilíbrio entre velocidade e qualidade.",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    keyPlaceholder: "sk-proj-...",
    needsBaseUrl: false,
    defaultBaseUrl: "",
    freeTextModel: false,
  },
  {
    id: "google",
    label: "Google (Gemini)",
    description: "Modelos Gemini. Rápido e com preços competitivos.",
    models: ["gemini-3.1-pro", "gemini-3.1-flash", "gemini-3-pro", "gemini-3-flash", "gemini-2.5-pro"],
    keyPlaceholder: "AIzaSy...",
    needsBaseUrl: false,
    defaultBaseUrl: "",
    freeTextModel: false,
  },
  {
    id: "openrouter",
    label: "OpenRouter (Múltiplos Modelos)",
    description:
      "Gateway para 100+ modelos com uma única chave de API (openrouter.ai).",
    models: [],
    keyPlaceholder: "sk-or-v1-...",
    needsBaseUrl: true,
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    freeTextModel: true,
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    description:
      "Execute localmente ou self-hosted. Zero custo de API, requer GPU/CPU.",
    models: [],
    keyPlaceholder: "ollama (qualquer valor)",
    needsBaseUrl: true,
    defaultBaseUrl: "http://localhost:11434",
    freeTextModel: false,
  },
];

export default function SettingsPage() {
  const [current, setCurrent] = useState<any>(null);
  const [provider, setProvider] = useState("anthropic");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("http://localhost:11434");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [loadingOllama, setLoadingOllama] = useState(false);

  const token = `Bearer ${getToken()}`;

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/ai-config`, {
      headers: { Authorization: token },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.provider) {
          setCurrent(data);
          setProvider(data.provider);
          setModel(data.model || "");
          if (data.baseUrl) {
            setBaseUrl(data.baseUrl);
            if (data.provider === "ollama") {
              fetchOllamaModels(data.baseUrl);
            }
          } else {
            // Pre-fill default URL for provider
            const p = PROVIDERS.find((x) => x.id === data.provider);
            if (p?.defaultBaseUrl) setBaseUrl(p.defaultBaseUrl);
          }
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!;

  const fetchOllamaModels = async (url: string) => {
    if (!url) return;
    setLoadingOllama(true);
    try {
      const res = await fetch(`${url}/api/tags`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const names: string[] = (data.models ?? []).map((m: any) => m.name);
      setOllamaModels(names);
      if (names.length > 0 && !model) setModel(names[0]);
    } catch {
      setOllamaModels([]);
    } finally {
      setLoadingOllama(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const effectiveModel =
      model || (selectedProvider.models[0] ?? ollamaModels[0] ?? "");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/ai-config`, {
      method: "PUT",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        model: effectiveModel,
        apiKey,
        ...(selectedProvider.needsBaseUrl ? { baseUrl } : {}),
      }),
    });
    setSaving(false);
    setSaved(true);
    setApiKey("");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/ai-config`,
      {
        headers: { Authorization: token },
      },
    );
    const data = await res.json();
    if (data && data.provider) setCurrent(data);
  };

  const handleDelete = async () => {
    if (!confirm("Remover a configuração de IA?")) return;
    setDeleting(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/ai-config`, {
      method: "DELETE",
      headers: { Authorization: token },
    });
    setCurrent(null);
    setDeleting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Configurações
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">
          Configure o provider de IA que será usado para gerar seletores CSS. A
          chave de API é armazenada encriptada no banco de dados.
        </p>
      </div>

      {/* Current config status */}
      {current ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              Provider ativo:{" "}
              <span className="capitalize">{current.provider}</span>
            </p>
            <p className="text-xs text-emerald-500 mt-0.5">
              Modelo: {current.model} · Chave: {current.maskedApiKey}
            </p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-medium text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 px-3 py-1.5 rounded-lg transition-all duration-150 disabled:opacity-40"
          >
            {deleting ? "Removendo..." : "Remover"}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4">
          <p className="text-sm text-amber-300">
            Nenhum provider configurado. Configure abaixo para habilitar o
            scraping com IA.
          </p>
        </div>
      )}

      {/* Provider selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setProvider(p.id);
              setModel("");
              // Pre-fill default base URL when switching provider
              const def = p.defaultBaseUrl;
              if (def) setBaseUrl(def);
              // Auto-fetch Ollama models if switching to ollama
              if (p.id === "ollama" && baseUrl) fetchOllamaModels(baseUrl);
            }}
            className={`text-left rounded-2xl border p-4 transition-all duration-150 ${
              provider === p.id
                ? "border-violet-500/50 bg-violet-500/10 ring-1 ring-violet-500/30"
                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/50"
            }`}
          >
            <p
              className={`text-sm font-semibold ${provider === p.id ? "text-violet-300" : "text-zinc-200"}`}
            >
              {p.label}
            </p>
            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
              {p.description}
            </p>
          </button>
        ))}
      </div>

      {/* Config form */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-5">
        <h2 className="font-semibold text-zinc-200 pb-3 border-b border-zinc-800">
          Configurar {selectedProvider.label}
        </h2>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Base URL — shown for Ollama and OpenRouter */}
          {selectedProvider.needsBaseUrl && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
                Base URL
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                onBlur={(e) =>
                  provider === "ollama" && fetchOllamaModels(e.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-zinc-600 mt-1.5">
                {provider === "ollama" ? (
                  <>
                    Padrão local:{" "}
                    <code className="text-violet-500 font-mono">
                      http://localhost:11434
                    </code>
                    {" · "}ao sair do campo os modelos instalados são carregados
                    automaticamente.
                  </>
                ) : (
                  <>
                    URL base da API.{" "}
                    <code className="text-violet-500 font-mono">
                      {selectedProvider.defaultBaseUrl}
                    </code>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Model — free text for OpenRouter, dynamic select for Ollama, static select for others */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
              Modelo
            </label>

            {selectedProvider.freeTextModel ? (
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ex: openai/gpt-4o, anthropic/claude-3-opus"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono transition-all"
              />
            ) : selectedProvider.needsBaseUrl ? (
              loadingOllama ? (
                <div className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-500">
                  Carregando modelos...
                </div>
              ) : ollamaModels.length > 0 ? (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                >
                  {ollamaModels.map((m) => (
                    <option key={m} value={m} className="bg-zinc-800">
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="ex: llama3.1, mistral (informe a URL acima para carregar)"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono transition-all"
                />
              )
            ) : (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              >
                {selectedProvider.models.map((m) => (
                  <option key={m} value={m} className="bg-zinc-800">
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
              Chave de API{" "}
              {current?.provider === provider ? (
                <span className="normal-case text-zinc-600 ml-1">
                  (deixe em branco para manter a atual)
                </span>
              ) : (
                "*"
              )}
            </label>
            <input
              type="password"
              placeholder={selectedProvider.keyPlaceholder}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required={!current || current.provider !== provider}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono transition-all"
            />
          </div>

          <div className="flex items-center gap-4 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed px-6 py-2.5 text-sm font-semibold text-white transition-all duration-150 shadow-lg shadow-violet-900/25"
            >
              {saving ? "Salvando..." : "Salvar configuração"}
            </button>
            {saved && (
              <span className="text-sm text-emerald-400 font-medium flex items-center gap-1.5">
                ✓ Salvo com sucesso
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Security note */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-xs text-zinc-600 leading-relaxed">
          <span className="text-zinc-500 font-medium">Segurança:</span> Chaves
          de API são criptografadas com AES-256-CBC antes de serem armazenadas.
          A chave nunca é retornada pela API — apenas um preview mascarado.
        </p>
      </div>
    </div>
  );
}
