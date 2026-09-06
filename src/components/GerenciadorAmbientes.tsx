"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimario, btnSecundario, btnPerigo, cardCls } from "@/components/ui";
import { BotaoPromptImagem } from "@/components/BotaoPromptImagem";
import { ImagemEntidade } from "@/components/ImagemEntidade";
import { GRAFIC } from "@/lib/grafic";

export type AmbienteDados = {
  id: string;
  nome: string;
  imagemUrl?: string | null;
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

  // ---- Mapeamento completo: IA lê a obra e cadastra locais que faltam (RF-74) ----
  const [mapeando, setMapeando] = useState(false);
  const [resumoMapeamento, setResumoMapeamento] = useState<string | null>(null);

  async function mapear() {
    if (
      !window.confirm(
        "A IA vai ler toda a obra e CADASTRAR automaticamente os ambientes/locais que aparecem no texto e ainda não existem. Continuar?",
      )
    )
      return;
    setMapeando(true);
    setResumoMapeamento(null);
    try {
      const res = await fetch(`/api/obras/${obraId}/ambientes/mapear`, {
        method: "POST",
      });
      const corpo = (await res.json().catch(() => null)) as
        | {
            existentes?: Array<{ nome: string }>;
            criados?: Array<{ nome: string }>;
            erro?: string;
          }
        | null;
      if (!res.ok || !corpo)
        throw new Error(corpo?.erro ?? "Falha no mapeamento.");
      const partes: string[] = [];
      if (corpo.criados?.length)
        partes.push(`🆕 Cadastrados: ${corpo.criados.map((a) => a.nome).join(", ")}`);
      if (corpo.existentes?.length)
        partes.push(`✅ Confirmados no texto: ${corpo.existentes.map((a) => a.nome).join(", ")}`);
      setResumoMapeamento(
        partes.length > 0
          ? partes.join(" · ")
          : "Nenhum ambiente identificado no texto ainda.",
      );
      router.refresh();
    } catch (e) {
      setResumoMapeamento(e instanceof Error ? e.message : "Falha no mapeamento.");
    } finally {
      setMapeando(false);
    }
  }

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
      {/* Mapeamento completo da obra */}
      <div className={`${cardCls} space-y-2`}>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={mapear}
            disabled={mapeando}
            className={btnPrimario}
            title="Lê toda a obra e cadastra os ambientes/locais que ainda não existem"
          >
            <span className="flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GRAFIC.mascoteTech} alt="" aria-hidden="true" className="h-4 w-4 object-contain" />
              {mapeando ? "⏳ Analisando a obra inteira…" : "🧠 Mapear ambientes do texto"}
            </span>
          </button>
          <span className="text-xs text-muted">
            A IA lê tudo que foi escrito e cria os locais que ainda não estão
            cadastrados (você pode editar depois)
          </span>
        </div>
        {resumoMapeamento && (
          <p className="rounded-md border border-line bg-surface p-2 text-xs text-muted">
            {resumoMapeamento}
          </p>
        )}
      </div>

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
            <ImagemEntidade tipo="ambiente" id={a.id} url={a.imagemUrl} rotulo="Ambiente" />
            <div className="min-w-0">
              <h3 className="font-semibold">{a.nome}</h3>
              {a.localizacao && <p className="mt-1 text-sm"><strong>Localização:</strong> {a.localizacao}</p>}
              {a.descricao && <p className="text-sm"><strong>Descrição:</strong> {a.descricao}</p>}
              {a.epoca && <p className="text-sm"><strong>Época:</strong> {a.epoca}</p>}
              {a.importanciaNarrativa && <p className="text-sm"><strong>Importância:</strong> {a.importanciaNarrativa}</p>}
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <BotaoPromptImagem tipo="ambiente" id={a.id} permitirGerar />
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
