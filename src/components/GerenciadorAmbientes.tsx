"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimario, btnSecundario, btnPerigo, cardCls } from "@/components/ui";
import { BotaoPromptImagem } from "@/components/BotaoPromptImagem";

export type AmbienteDados = {
  id: string;
  nome: string;
  localizacao: string | null;
  descricao: string | null;
  epoca: string | null;
  importanciaNarrativa: string | null;
};

const CAMPOS_TEXTO = [
  { nome: "localizacao", rotulo: "Localização" },
  { nome: "descricao", rotulo: "Descrição" },
  { nome: "epoca", rotulo: "Época" },
  { nome: "importanciaNarrativa", rotulo: "Importância narrativa" },
] as const;

function FormAmbiente({
  inicial,
  aoSalvar,
  aoCancelar,
}: {
  inicial?: AmbienteDados;
  aoSalvar: (corpo: Record<string, unknown>) => Promise<void>;
  aoCancelar?: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setEnviando(true);
    setErro(null);
    try {
      await aoSalvar(Object.fromEntries(form.entries()));
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-3">
      <div>
        <label className={labelCls}>Nome *</label>
        <input name="nome" required maxLength={200} defaultValue={inicial?.nome} className={inputCls} />
      </div>
      {CAMPOS_TEXTO.map((c) => (
        <div key={c.nome}>
          <label className={labelCls}>{c.rotulo}</label>
          <textarea
            name={c.nome}
            rows={2}
            defaultValue={inicial?.[c.nome] ?? ""}
            className={inputCls}
          />
        </div>
      ))}

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className={btnPrimario}>
          {enviando ? "Salvando…" : "Salvar"}
        </button>
        {aoCancelar && (
          <button type="button" onClick={aoCancelar} className={btnSecundario}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

async function requisicao(url: string, metodo: string, corpo?: unknown) {
  const res = await fetch(url, {
    method: metodo,
    headers: corpo ? { "Content-Type": "application/json" } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (!res.ok) throw new Error();
}

export function GerenciadorAmbientes({
  obraId,
  iniciais,
}: {
  obraId: string;
  iniciais: AmbienteDados[];
}) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  async function criar(corpo: Record<string, unknown>) {
    await requisicao(`/api/obras/${obraId}/ambientes`, "POST", corpo);
    setCriando(false);
    router.refresh();
  }

  async function editar(id: string, corpo: Record<string, unknown>) {
    await requisicao(`/api/ambientes/${id}`, "PATCH", corpo);
    setEditandoId(null);
    router.refresh();
  }

  async function excluir(id: string, nome: string) {
    if (!confirm(`Excluir o ambiente "${nome}"?`)) return;
    await requisicao(`/api/ambientes/${id}`, "DELETE");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!criando && (
        <button onClick={() => setCriando(true)} className={btnPrimario}>
          + Novo ambiente
        </button>
      )}
      {criando && (
        <div className={cardCls}>
          <h3 className="mb-3 font-semibold">Novo ambiente</h3>
          <FormAmbiente aoSalvar={criar} aoCancelar={() => setCriando(false)} />
        </div>
      )}

      {iniciais.length === 0 && !criando && (
        <p className="text-sm text-muted">Nenhum ambiente cadastrado.</p>
      )}

      {iniciais.map((a) =>
        editandoId === a.id ? (
          <div key={a.id} className={cardCls}>
            <h3 className="mb-3 font-semibold">Editar: {a.nome}</h3>
            <FormAmbiente
              inicial={a}
              aoSalvar={(corpo) => editar(a.id, corpo)}
              aoCancelar={() => setEditandoId(null)}
            />
          </div>
        ) : (
          <div key={a.id} className={`${cardCls} flex items-start justify-between gap-4`}>
            <div className="min-w-0">
              <h3 className="font-semibold">{a.nome}</h3>
              {a.localizacao && <p className="mt-1 text-sm"><strong>Localização:</strong> {a.localizacao}</p>}
              {a.descricao && <p className="text-sm"><strong>Descrição:</strong> {a.descricao}</p>}
              {a.epoca && <p className="text-sm"><strong>Época:</strong> {a.epoca}</p>}
              {a.importanciaNarrativa && <p className="text-sm"><strong>Importância:</strong> {a.importanciaNarrativa}</p>}
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <BotaoPromptImagem tipo="ambiente" id={a.id} />
              <button onClick={() => setEditandoId(a.id)} className={btnSecundario}>
                Editar
              </button>
              <button onClick={() => excluir(a.id, a.nome)} className={btnPerigo}>
                Excluir
              </button>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
