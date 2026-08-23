"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAPEIS, ROTULO_PAPEL } from "@/lib/constants";
import { inputCls, labelCls, btnPrimario, btnSecundario, btnPerigo, cardCls } from "@/components/ui";
import { BotaoPromptImagem } from "@/components/BotaoPromptImagem";
import { ImagemEntidade } from "@/components/ImagemEntidade";

export type PersonagemDados = {
  id: string;
  nome: string;
  papel: string;
  imagemUrl?: string | null;
  fisico: string | null;
  psicologico: string | null;
  historia: string | null;
  comportamento: string | null;
};

const CAMPOS_TEXTO = [
  { nome: "fisico", rotulo: "Físico" },
  { nome: "psicologico", rotulo: "Psicológico" },
  { nome: "historia", rotulo: "História" },
  { nome: "comportamento", rotulo: "Comportamento" },
] as const;

function FormPersonagem({
  inicial,
  aoSalvar,
  aoCancelar,
}: {
  inicial?: PersonagemDados;
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Nome *</label>
          <input name="nome" required maxLength={200} defaultValue={inicial?.nome} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Papel</label>
          <select name="papel" defaultValue={inicial?.papel ?? "SECUNDARIO"} className={inputCls}>
            {PAPEIS.map((p) => (
              <option key={p} value={p}>{ROTULO_PAPEL[p]}</option>
            ))}
          </select>
        </div>
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

export function GerenciadorPersonagens({
  obraId,
  iniciais,
}: {
  obraId: string;
  iniciais: PersonagemDados[];
}) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  async function criar(corpo: Record<string, unknown>) {
    await requisicao(`/api/obras/${obraId}/personagens`, "POST", corpo);
    setCriando(false);
    router.refresh();
  }

  async function editar(id: string, corpo: Record<string, unknown>) {
    await requisicao(`/api/personagens/${id}`, "PATCH", corpo);
    setEditandoId(null);
    router.refresh();
  }

  async function excluir(id: string, nome: string) {
    if (!confirm(`Excluir o personagem "${nome}"?`)) return;
    await requisicao(`/api/personagens/${id}`, "DELETE");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!criando && (
        <button onClick={() => setCriando(true)} className={btnPrimario}>
          + Novo personagem
        </button>
      )}
      {criando && (
        <div className={cardCls}>
          <h3 className="mb-3 font-semibold">Novo personagem</h3>
          <FormPersonagem aoSalvar={criar} aoCancelar={() => setCriando(false)} />
        </div>
      )}

      {iniciais.length === 0 && !criando && (
        <p className="text-sm text-muted">Nenhum personagem cadastrado.</p>
      )}

      {iniciais.map((p) =>
        editandoId === p.id ? (
          <div key={p.id} className={cardCls}>
            <h3 className="mb-3 font-semibold">Editar: {p.nome}</h3>
            <FormPersonagem
              inicial={p}
              aoSalvar={(corpo) => editar(p.id, corpo)}
              aoCancelar={() => setEditandoId(null)}
            />
          </div>
        ) : (
          <div key={p.id} className={`${cardCls} flex items-start justify-between gap-4`}>
            <ImagemEntidade tipo="personagem" id={p.id} url={p.imagemUrl} rotulo="Personagem" />
            <div className="min-w-0">
              <h3 className="font-semibold">{p.nome}</h3>
              <span className="mt-1 inline-block rounded-full bg-chipbg px-2 py-0.5 text-xs text-soft">
                {ROTULO_PAPEL[p.papel] ?? p.papel}
              </span>
              {p.fisico && <p className="mt-2 text-sm"><strong>Físico:</strong> {p.fisico}</p>}
              {p.psicologico && <p className="text-sm"><strong>Psicológico:</strong> {p.psicologico}</p>}
              {p.historia && <p className="text-sm"><strong>História:</strong> {p.historia}</p>}
              {p.comportamento && <p className="text-sm"><strong>Comportamento:</strong> {p.comportamento}</p>}
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <BotaoPromptImagem tipo="personagem" id={p.id} />
              <button onClick={() => setEditandoId(p.id)} className={btnSecundario}>
                Editar
              </button>
              <button onClick={() => excluir(p.id, p.nome)} className={btnPerigo}>
                Excluir
              </button>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
