"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimario, btnSecundario, btnPerigo, cardCls } from "@/components/ui";
import { ImagemEntidade } from "@/components/ImagemEntidade";
import { EstadoVazio } from "@/components/EstadoVazio";
import { GRAFIC } from "@/lib/grafic";

export type ArtefatoDados = {
  id: string;
  nome: string;
  imagemUrl?: string | null;
  descricao: string | null;
  historia: string | null;
};

function FormArtefato({
  inicial,
  aoSalvar,
  aoCancelar,
}: {
  inicial?: ArtefatoDados;
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
      <div>
        <label className={labelCls}>Descrição</label>
        <textarea
          name="descricao"
          rows={3}
          maxLength={5000}
          placeholder="O que é, aparência e função do artefato dentro do universo"
          defaultValue={inicial?.descricao ?? ""}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>História</label>
        <textarea
          name="historia"
          rows={3}
          maxLength={5000}
          placeholder="Origem, lendas e eventos ligados ao artefato"
          defaultValue={inicial?.historia ?? ""}
          className={inputCls}
        />
      </div>

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

export function GerenciadorArtefatos({
  obraId,
  iniciais,
}: {
  obraId: string;
  iniciais: ArtefatoDados[];
}) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  async function criar(corpo: Record<string, unknown>) {
    await requisicao(`/api/obras/${obraId}/artefatos`, "POST", corpo);
    setCriando(false);
    router.refresh();
  }

  async function editar(id: string, corpo: Record<string, unknown>) {
    await requisicao(`/api/artefatos/${id}`, "PATCH", corpo);
    setEditandoId(null);
    router.refresh();
  }

  async function excluir(id: string, nome: string) {
    if (!confirm(`Excluir o artefato "${nome}"?`)) return;
    await requisicao(`/api/artefatos/${id}`, "DELETE");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!criando && (
        <button onClick={() => setCriando(true)} className={btnPrimario}>
          + Novo artefato
        </button>
      )}
      {criando && (
        <div className={cardCls}>
          <h3 className="mb-3 font-semibold">Novo artefato</h3>
          <FormArtefato aoSalvar={criar} aoCancelar={() => setCriando(false)} />
        </div>
      )}

      {iniciais.length === 0 && !criando && (
        <EstadoVazio
          src={GRAFIC.vazioDashboard}
          alt="Nenhum artefato cadastrado"
          mensagem="Nenhum artefato cadastrado. Registre itens importantes do universo (relíquias, objetos mágicos, documentos…) — a IA passa a respeitá-los nas cenas."
        />
      )}

      {iniciais.map((a) =>
        editandoId === a.id ? (
          <div key={a.id} className={cardCls}>
            <h3 className="mb-3 font-semibold">Editar: {a.nome}</h3>
            <FormArtefato
              inicial={a}
              aoSalvar={(corpo) => editar(a.id, corpo)}
              aoCancelar={() => setEditandoId(null)}
            />
          </div>
        ) : (
          <div key={a.id} className={`${cardCls} flex items-start justify-between gap-4`}>
            <ImagemEntidade tipo="artefato" id={a.id} url={a.imagemUrl} rotulo="Artefato" />
            <div className="min-w-0">
              <h3 className="font-semibold">{a.nome}</h3>
              {a.descricao && <p className="mt-1 text-sm"><strong>Descrição:</strong> {a.descricao}</p>}
              {a.historia && <p className="text-sm"><strong>História:</strong> {a.historia}</p>}
            </div>
            <div className="flex shrink-0 flex-col gap-2">
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