"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimario, btnSecundario, cardCls } from "@/components/ui";

export type CapituloDados = {
  id: string;
  titulo: string;
  objetivo: string | null;
  ordemEscrita: number;
  ordemNarrativa: number | null;
  status: string;
};

export function GerenciadorCapitulos({
  obraId,
  iniciais,
}: {
  obraId: string;
  iniciais: CapituloDados[];
}) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [movendo, setMovendo] = useState<string | null>(null);

  async function criarCapitulo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/obras/${obraId}/capitulos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.get("titulo"),
          objetivo: form.get("objetivo"),
        }),
      });
      if (!res.ok) {
        const dados = await res.json();
        setErro(dados.erro ?? "Erro ao criar capítulo.");
        return;
      }
      setCriando(false);
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  async function mover(id: string, direcao: "CIMA" | "BAIXO") {
    setMovendo(id);
    try {
      await fetch(`/api/capitulos/${id}/mover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direcao }),
      });
      router.refresh();
    } finally {
      setMovendo(null);
    }
  }

  return (
    <div className="space-y-4">
      {!criando && (
        <button onClick={() => setCriando(true)} className={btnPrimario}>
          + Novo capítulo
        </button>
      )}
      {criando && (
        <div className={cardCls}>
          <h3 className="mb-3 font-semibold">Novo capítulo</h3>
          <form onSubmit={criarCapitulo} className="space-y-3">
            <div>
              <label htmlFor="titulo-cap" className={labelCls}>Título *</label>
              <input id="titulo-cap" name="titulo" required maxLength={200} className={inputCls} />
            </div>
            <div>
              <label htmlFor="objetivo-cap" className={labelCls}>Objetivo</label>
              <textarea id="objetivo-cap" name="objetivo" rows={2} maxLength={500} className={inputCls} />
            </div>
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={enviando} className={btnPrimario}>
                {enviando ? "Criando…" : "Criar"}
              </button>
              <button type="button" onClick={() => setCriando(false)} className={btnSecundario}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {iniciais.length === 0 && !criando && (
        <p className="text-sm text-muted">Nenhum capítulo criado ainda.</p>
      )}

      <ol className="space-y-2">
        {iniciais.map((c, i) => (
          <li key={c.id} className={`${cardCls} flex items-center gap-4 py-3`}>
            <span className="w-8 shrink-0 text-center font-bold text-faint">
              {c.ordemNarrativa ?? "—"}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/obras/${obraId}/capitulos/${c.id}`}
                className="font-medium hover:underline"
              >
                {c.titulo}
              </Link>
              {c.objetivo && (
                <p className="truncate text-sm text-muted">{c.objetivo}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <button
                onClick={() => mover(c.id, "CIMA")}
                disabled={movendo !== null || i === 0}
                aria-label={`Mover ${c.titulo} para cima`}
                className={btnSecundario}
              >
                ↑
              </button>
              <button
                onClick={() => mover(c.id, "BAIXO")}
                disabled={movendo !== null || i === iniciais.length - 1}
                aria-label={`Mover ${c.titulo} para baixo`}
                className={btnSecundario}
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
