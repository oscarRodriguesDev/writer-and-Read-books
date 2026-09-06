"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAPEIS, ROTULO_PAPEL } from "@/lib/constants";
import { inputCls, labelCls, btnPrimario, btnSecundario, btnPerigo, cardCls } from "@/components/ui";
import { BotaoPromptImagem } from "@/components/BotaoPromptImagem";
import { ImagemEntidade } from "@/components/ImagemEntidade";
import { EstadoVazio } from "@/components/EstadoVazio";
import { RelacoesPersonagem } from "@/components/RelacoesPersonagem";
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
          <div key={p.id} className={`${cardCls} flex items-start justify-between gap-4`}>
            <ImagemEntidade tipo="personagem" id={p.id} url={p.imagemUrl} rotulo="Personagem" />
            <div className="min-w-0">
              <h3 className="font-semibold">
                {p.nome}
                {relevancia !== null && (
                  <span className="ml-2 rounded-full bg-chipbg px-2 py-0.5 text-xs font-normal text-soft">
                    ✨ {relevancia}% relevante
                  </span>
                )}
              </h3>
              {relevancia !== null &&
                resultados.find((r) => r.id === p.id)?.motivo && (
                  <p className="mt-1 rounded-md border border-line bg-surface p-2 text-xs text-muted">
                    💡 {resultados.find((r) => r.id === p.id)!.motivo}
                  </p>
                )}
              <span className="mt-1 inline-block rounded-full bg-chipbg px-2 py-0.5 text-xs text-soft">
                {ROTULO_PAPEL[p.papel] ?? p.papel}
              </span>
              {p.fisico && <p className="mt-2 text-sm"><strong>Físico:</strong> {p.fisico}</p>}
              {p.psicologico && <p className="text-sm"><strong>Psicológico:</strong> {p.psicologico}</p>}
              {p.historia && <p className="text-sm"><strong>História:</strong> {p.historia}</p>}
              {p.comportamento && <p className="text-sm"><strong>Comportamento:</strong> {p.comportamento}</p>}
              <RelacoesPersonagem
                obraId={obraId}
                personagemId={p.id}
                personagemNome={p.nome}
                outros={iniciais
                  .filter((o) => o.id !== p.id)
                  .map((o) => ({ id: o.id, nome: o.nome }))}
              />
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <BotaoPromptImagem tipo="personagem" id={p.id} permitirGerar />
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
