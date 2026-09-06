"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAPEIS, ROTULO_PAPEL } from "@/lib/constants";
import { inputCls, labelCls, btnPrimario, btnSecundario, cardCls } from "@/components/ui";
import { EstadoVazio } from "@/components/EstadoVazio";
import { CardPersonagem } from "@/components/CardPersonagem";
import { GRAFIC } from "@/lib/grafic";

export type PersonagemDados = {
  id: string;
  nome: string;
  papel: string;
  imagemUrl?: string | null;
  fisico: string | null;
  psicologico: string | null;
  historia: string | null;
  comportamento: string | null;
  objetivo: string | null;
  arco: string | null;
  arcoDescricao: string | null;
};

const CAMPOS_TEXTO = [
  { nome: "fisico", rotulo: "Físico" },
  { nome: "psicologico", rotulo: "Psicológico" },
  { nome: "historia", rotulo: "História" },
  { nome: "comportamento", rotulo: "Comportamento" },
  { nome: "objetivo", rotulo: "Objetivo" },
  { nome: "arcoDescricao", rotulo: "Arco — descrição" },
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
        <div className="sm:col-span-2">
          <label className={labelCls}>
            Arco narrativo <span className="text-faint">(ex.: "Herói", "Redenção", "Queda", "Amadurecimento")</span>
          </label>
          <input name="arco" maxLength={200} defaultValue={inicial?.arco ?? ""} placeholder="Transformação do personagem ao longo da história" className={inputCls} />
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

  // ---- Mapeamento completo: IA lê a obra e cadastra quem falta (RF-74) ----
  const [mapeando, setMapeando] = useState(false);
  const [resumoMapeamento, setResumoMapeamento] = useState<string | null>(null);

  async function mapear() {
    if (
      !window.confirm(
        "A IA vai ler toda a obra, listar os personagens encontrados e CADASTRAR automaticamente os que ainda não existem (como SECUNDÁRIO). Continuar?",
      )
    )
      return;
    setMapeando(true);
    setResumoMapeamento(null);
    try {
      const res = await fetch(`/api/obras/${obraId}/personagens/mapear`, {
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
        partes.push(`🆕 Cadastrados: ${corpo.criados.map((p) => p.nome).join(", ")}`);
      if (corpo.existentes?.length)
        partes.push(`✅ Confirmados no texto: ${corpo.existentes.map((p) => p.nome).join(", ")}`);
      setResumoMapeamento(
        partes.length > 0
          ? partes.join(" · ")
          : "Nenhum personagem identificado no texto ainda.",
      );
      router.refresh();
    } catch (e) {
      setResumoMapeamento(e instanceof Error ? e.message : "Falha no mapeamento.");
    } finally {
      setMapeando(false);
    }
  }

  // ---- Busca semântica de personagens via IA (RF-55/56) ----
  const [consulta, setConsulta] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<
    Array<{ id: string; nome: string; relevancia: number; motivo: string }>
  >([]);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  async function buscar() {
    if (!consulta.trim()) return;
    setBuscando(true);
    setErroBusca(null);
    try {
      const res = await fetch(`/api/obras/${obraId}/personagens/buscar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consulta }),
      });
      const corpo = (await res.json().catch(() => null)) as
        | { resultados?: typeof resultados; erro?: string }
        | null;
      if (!res.ok || !corpo) throw new Error(corpo?.erro ?? "Falha na busca.");
      setResultados(corpo.resultados ?? []);
    } catch (e) {
      setErroBusca(e instanceof Error ? e.message : "Falha na busca.");
    } finally {
      setBuscando(false);
    }
  }

  // Com busca ativa, a lista mostra apenas os encontrados (na ordem de relevância)
  const visiveis =
    resultados.length > 0
      ? resultados
          .map((r) => {
            const p = iniciais.find((x) => x.id === r.id);
            return p ? { personagem: p, relevancia: r.relevancia } : null;
          })
          .filter((v): v is { personagem: PersonagemDados; relevancia: number } => v !== null)
      : iniciais.map((personagem) => ({ personagem, relevancia: null as number | null }));

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
      {/* Busca semântica com IA */}
      <div className={`${cardCls} space-y-2`}>
        <label className={labelCls}>
          🔎 Buscar personagens pelo que já foi escrito (IA)
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            maxLength={500}
            placeholder="Ex.: quem sabe sobre o tesouro? / a mulher loira que traiu o grupo"
            aria-label="Descrição do que procurar nos personagens"
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={buscar}
            disabled={buscando || !consulta.trim()}
            className={btnPrimario}
          >
            {buscando ? "⏳ Lendo a obra…" : "Buscar"}
          </button>
          {resultados.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setResultados([]);
                setConsulta("");
              }}
              className={btnSecundario}
            >
              ✖ Limpar busca
            </button>
          )}
        </div>
        {erroBusca && <p className="text-sm text-red-600">{erroBusca}</p>}
        {buscando && (
          <p className="text-xs text-muted">
            A IA está relendo as cenas da obra — pode levar até 5 min.
          </p>
        )}
      </div>

      {/* Mapeamento completo da obra */}
      <div className={`${cardCls} space-y-2`}>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={mapear}
            disabled={mapeando}
            className={btnPrimario}
            title="Lê toda a obra, lista os personagens e cadastra os que ainda não existem"
          >
            <span className="flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GRAFIC.mascoteTech} alt="" aria-hidden="true" className="h-4 w-4 object-contain" />
              {mapeando ? "⏳ Analisando a obra inteira…" : "🧠 Mapear personagens do texto"}
            </span>
          </button>
          <span className="text-xs text-muted">
            A IA lê tudo que foi escrito e cria os personagens que ainda não
            estão cadastrados (você pode editar depois)
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
          + Novo personagem
        </button>
      )}
      {criando && (
        <div className={cardCls}>
          <h3 className="mb-3 font-semibold">Novo personagem</h3>
          <FormPersonagem aoSalvar={criar} aoCancelar={() => setCriando(false)} />
        </div>
      )}

      {visiveis.length === 0 && !criando && (
        <EstadoVazio
          src={GRAFIC.vazioPersonagens}
          alt="Nenhum personagem cadastrado"
          mensagem={
            resultados.length === 0 && consulta.trim()
              ? "Nenhum personagem corresponde a essa busca."
              : "Nenhum personagem cadastrado."
          }
        />
      )}

      {visiveis.map(({ personagem: p, relevancia }) =>
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
          <CardPersonagem
            key={p.id}
            obraId={obraId}
            personagem={p}
            relevancia={relevancia}
            motivo={resultados.find((r) => r.id === p.id)?.motivo ?? null}
            outros={iniciais
              .filter((o) => o.id !== p.id)
              .map((o) => ({ id: o.id, nome: o.nome }))}
            aoEditar={() => setEditandoId(p.id)}
            aoExcluir={() => void excluir(p.id, p.nome)}
          />
        ),
      )}
    </div>
  );
}
