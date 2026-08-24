"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimario, btnSecundario } from "@/components/ui";

export type ObraDados = {
  titulo: string;
  genero: string | null;
  subgenero: string | null;
  tema: string | null;
  publicoAlvo: string | null;
  descricao: string | null;
  status: string;
};

const STATUS = [
  { valor: "PLANEJAMENTO", rotulo: "Planejamento" },
  { valor: "ESCRITA", rotulo: "Escrita" },
  { valor: "REVISAO", rotulo: "Revisão" },
  { valor: "CONCLUIDA", rotulo: "Concluída" },
] as const;

/** Edição de todos os dados da obra (RP-07/08): título, gênero, status etc. */
export function FormEditarObra({
  obraId,
  inicial,
}: {
  obraId: string;
  inicial: ObraDados;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSalvando(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/obras/${obraId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      if (!res.ok) {
        const corpo = (await res.json().catch(() => null)) as { erro?: string } | null;
        setFeedback(corpo?.erro ?? "Erro ao salvar.");
        return;
      }
      setFeedback("Dados salvos ✓");
      router.refresh();
    } catch {
      setFeedback("Falha de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={() => setAberto((v) => !v)} className={btnSecundario}>
        {aberto ? "Fechar edição" : "✏️ Editar dados da obra"}
      </button>

      {aberto && (
        <form onSubmit={aoEnviar} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="titulo" className={labelCls}>Título *</label>
              <input id="titulo" name="titulo" required maxLength={200} defaultValue={inicial.titulo} className={inputCls} />
            </div>
            <div>
              <label htmlFor="status" className={labelCls}>Status</label>
              <select id="status" name="status" defaultValue={inicial.status} className={inputCls}>
                {STATUS.map((s) => (
                  <option key={s.valor} value={s.valor}>{s.rotulo}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="genero" className={labelCls}>Gênero</label>
              <input id="genero" name="genero" maxLength={100} defaultValue={inicial.genero ?? ""} className={inputCls} />
            </div>
            <div>
              <label htmlFor="subgenero" className={labelCls}>Subgênero</label>
              <input id="subgenero" name="subgenero" maxLength={100} defaultValue={inicial.subgenero ?? ""} className={inputCls} />
            </div>
            <div>
              <label htmlFor="tema" className={labelCls}>Tema</label>
              <input id="tema" name="tema" maxLength={200} defaultValue={inicial.tema ?? ""} className={inputCls} />
            </div>
            <div>
              <label htmlFor="publicoAlvo" className={labelCls}>Público-alvo</label>
              <input id="publicoAlvo" name="publicoAlvo" maxLength={200} defaultValue={inicial.publicoAlvo ?? ""} className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="descricao" className={labelCls}>Descrição</label>
            <textarea id="descricao" name="descricao" rows={4} maxLength={2000} defaultValue={inicial.descricao ?? ""} className={inputCls} />
          </div>

          {feedback && <p className="text-sm text-muted">{feedback}</p>}

          <button type="submit" disabled={salvando} className={btnPrimario}>
            {salvando ? "Salvando…" : "Salvar dados"}
          </button>
        </form>
      )}
    </div>
  );
}
