"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Copy, Check, Trash2, Key, AlertTriangle } from "lucide-react";
import { getToken } from "@/lib/auth";

interface Token {
  id: number;
  name: string;
  description?: string;
  token: string;
  username?: string;
  createdAt: string;
  lastUsedAt?: string;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const authHeader = `Bearer ${getToken()}`;
  const headers = {
    Authorization: authHeader,
    "Content-Type": "application/json",
  };

  const load = useCallback(async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/tokens`, {
      headers: { Authorization: authHeader },
    });
    const data = await res.json();
    setTokens(Array.isArray(data) ? data : data.tokens || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/tokens`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: newName, description: newDesc }),
    });
    const data = await res.json();
    setCreated(data.token);
    setNewName("");
    setNewDesc("");
    setCreating(false);
    load();
  };

  const handleRevoke = async (id: number) => {
    if (!confirm("Revogar este token? Esta ação não pode ser desfeita."))
      return;
    setDeleting(id);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/tokens/${id}`, {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });
    setDeleting(null);
    load();
  };

  const handleCopy = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(created);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          API Tokens
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">
          Tokens para integração service-to-service. Use o header{" "}
          <code className="bg-zinc-800 text-violet-400 px-1.5 py-0.5 rounded-md text-xs font-mono border border-zinc-700">
            X-API-Key: &lt;token&gt;
          </code>{" "}
          nas suas chamadas.
        </p>
      </div>

      {/* New token form */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <Plus className="w-4 h-4 text-zinc-500" />
          <h2 className="font-semibold text-zinc-200 text-sm">
            Criar novo token
          </h2>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
                Nome *
              </label>
              <input
                type="text"
                placeholder="ex: licita-sync-prod"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
                Descrição
              </label>
              <input
                type="text"
                placeholder="ex: Backend do licita-sync"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 shadow-lg shadow-violet-900/25"
          >
            <Key className="w-4 h-4" />
            {creating ? "Criando..." : "Criar token"}
          </button>
        </form>
      </div>

      {/* One-time reveal */}
      {created && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm font-semibold text-amber-300">
              Copie agora — este valor não será exibido novamente!
            </p>
          </div>
          <code className="block bg-zinc-900 border border-amber-500/25 rounded-xl px-4 py-3 text-sm font-mono text-amber-300 break-all select-all leading-relaxed">
            {created}
          </code>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 px-3 py-1.5 rounded-lg transition-all duration-150"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copiado!" : "Copiar"}
            </button>
            <button
              onClick={() => setCreated(null)}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Token list */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            {tokens.length} token{tokens.length !== 1 ? "s" : ""}
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                Criado em
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                Último uso
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {tokens.map((t) => (
              <tr
                key={t.id}
                className="hover:bg-zinc-800/40 transition-colors duration-100"
              >
                <td className="px-4 py-3.5">
                  <p className="font-medium text-zinc-200">{t.name}</p>
                  {t.description && (
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {t.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3.5 text-zinc-500 text-xs hidden md:table-cell">
                  {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3.5 text-zinc-500 text-xs hidden md:table-cell">
                  {t.lastUsedAt ? (
                    new Date(t.lastUsedAt).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  ) : (
                    <span className="text-zinc-700">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    onClick={() => handleRevoke(t.id)}
                    disabled={deleting === t.id}
                    className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-150 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {tokens.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <Key className="w-7 h-7 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-600 text-sm">
                    Nenhum token criado ainda.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
