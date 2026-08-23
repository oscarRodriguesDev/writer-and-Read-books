"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ESCALAS_TEMPORAIS,
  ROTULO_ESCALA_TEMPORAL,
} from "@/lib/constants";
import { inputCls, labelCls, btnPrimario, btnSecundario, btnPerigo, cardCls } from "@/components/ui";

export type EventoDados = {
  id: string;
  titulo: string;
  descricao: string | null;
  escalaTemporal: string;
  dataInicio: unknown;
  dataFim: unknown;
  ordemCronologica: number;
  capituloId: string | null;
  capituloTitulo: string | null;
};

export type CapituloResumo = { id: string; titulo: string };

/** Campos de data como texto (vazio = não informado). */
type CamposData = { ano: string; mes: string; dia: string; hora: string };
const DATA_VAZIA: CamposData = { ano: "", mes: "", dia: "", hora: "" };

/** Quantos campos de data exibir conforme a escala escolhida. */
const NIVEL_ESCALA: Record<string, number> = {
  ANO: 1,
  MES: 2,
  DIA: 3,
  HORA: 4,
  INDEFINIDO: 0,
};

/** Converte o Json livre do banco em texto legível. */
export function formatarData(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  const partes: string[] = [];
  if (d.ano !== undefined) partes.push(String(d.ano));
  if (d.mes !== undefined) partes.push(`${String(d.mes).padStart(2, "0")}`);
  if (d.dia !== undefined) partes.push(`${String(d.dia).padStart(2, "0")}`);
  let texto = partes.join("/");
  if (d.hora !== undefined) texto += ` ${String(d.hora).padStart(2, "0")}h`;
  return texto;
}

function jsonDeCampos(campos: CamposData): Record<string, number> | null {
  const resultado: Record<string, number> = {};
  for (const chave of ["ano", "mes", "dia", "hora"] as const) {
    const valor = campos[chave].trim();
    if (valor !== "") {
      const n = Number(valor);
      if (!Number.isInteger(n)) return null;
      resultado[chave] = n;
    }
  }
  return Object.keys(resultado).length ? resultado : null;
}

function camposDeJson(data: unknown): CamposData {
  if (!data || typeof data !== "object") return { ...DATA_VAZIA };
  const d = data as Record<string, unknown>;
  return {
    ano: d.ano !== undefined ? String(d.ano) : "",
    mes: d.mes !== undefined ? String(d.mes) : "",
    dia: d.dia !== undefined ? String(d.dia) : "",
    hora: d.hora !== undefined ? String(d.hora) : "",
  };
}

type FormEstado = {
  titulo: string;
  descricao: string;
  escalaTemporal: string;
  inicio: CamposData;
  fim: CamposData;
  capituloId: string;
  ordem: string;
};

function estadoInicial(ev?: EventoDados): FormEstado {
  return {
    titulo: ev?.titulo ?? "",
    descricao: ev?.descricao ?? "",
    escalaTemporal: ev?.escalaTemporal ?? "INDEFINIDO",
    inicio: camposDeJson(ev?.dataInicio),
    fim: camposDeJson(ev?.dataFim),
    capituloId: ev?.capituloId ?? "",
    ordem: ev !== undefined ? String(ev.ordemCronologica) : "",
  };
}

async function requisicao(url: string, metodo: string, corpo?: unknown): Promise<string | null> {
  const res = await fetch(url, {
    method: metodo,
    headers: corpo ? { "Content-Type": "application/json" } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (res.ok) return null;
  const dados = (await res.json().catch(() => null)) as { erro?: string } | null;
  return dados?.erro ?? "Falha na requisição.";
}

/** Inputs de data parcial conforme a escala (ano → mês → dia → hora). */
function CamposDataInputs({
  rotulo,
  campos,
  nivel,
  aoAlterar,
}: {
  rotulo: string;
  campos: CamposData;
  nivel: number;
  aoAlterar: (campos: CamposData) => void;
}) {
  if (nivel === 0) return null;
  const definidos: Array<{ chave: keyof CamposData; placeholder: string }> = [
    { chave: "ano", placeholder: "Ano" },
    { chave: "mes", placeholder: "Mês" },
    { chave: "dia", placeholder: "Dia" },
    { chave: "hora", placeholder: "Hora" },
  ].slice(0, nivel) as Array<{ chave: keyof CamposData; placeholder: string }>;

  return (
    <div>
      <span className={labelCls}>{rotulo}</span>
      <div className="grid grid-cols-4 gap-2">
        {definidos.map(({ chave, placeholder }) => (
          <input
            key={chave}
            value={campos[chave]}
            onChange={(e) => aoAlterar({ ...campos, [chave]: e.target.value })}
            inputMode="numeric"
            maxLength={6}
            placeholder={placeholder}
            aria-label={`${rotulo} — ${placeholder}`}
            className={inputCls}
          />
        ))}
      </div>
    </div>
  );
}

function FormEvento({
  inicial,
  capitulos,
  aoSalvar,
  aoCancelar,
}: {
  inicial?: EventoDados;
  capitulos: CapituloResumo[];
  aoSalvar: (corpo: Record<string, unknown>) => Promise<string | null>;
  aoCancelar: () => void;
}) {
  const [form, setForm] = useState<FormEstado>(() => estadoInicial(inicial));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const nivelEscala = NIVEL_ESCALA[form.escalaTemporal] ?? 0;

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    const dataInicio = jsonDeCampos(form.inicio);
    const dataFim = jsonDeCampos(form.fim);
    if (dataInicio === null || dataFim === null) {
      setErro("Datas devem conter apenas números inteiros.");
      setEnviando(false);
      return;
    }

    const erroRetorno = await aoSalvar({
      titulo: form.titulo,
      descricao: form.descricao,
      escalaTemporal: form.escalaTemporal,
      ...(form.escalaTemporal !== "INDEFINIDO" && { dataInicio, dataFim }),
      ...(form.capituloId && { capituloId: form.capituloId }),
      ...(form.ordem.trim() !== "" && { ordemCronologica: Number(form.ordem) }),
    });
    if (erroRetorno) {
      setErro(erroRetorno);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-3">
      <div>
        <label className={labelCls}>Título *</label>
        <input
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          required
          maxLength={200}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Descrição</label>
        <textarea
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          rows={2}
          maxLength={5000}
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Escala temporal</label>
          <select
            value={form.escalaTemporal}
            onChange={(e) => setForm({ ...form, escalaTemporal: e.target.value })}
            className={inputCls}
          >
            {ESCALAS_TEMPORAIS.map((esc) => (
              <option key={esc} value={esc}>
                {ROTULO_ESCALA_TEMPORAL[esc]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Capítulo vinculado</label>
          <select
            value={form.capituloId}
            onChange={(e) => setForm({ ...form, capituloId: e.target.value })}
            className={inputCls}
          >
            <option value="">Nenhum</option>
            {capitulos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Posição (ordem)</label>
          <input
            value={form.ordem}
            onChange={(e) => setForm({ ...form, ordem: e.target.value })}
            inputMode="numeric"
            placeholder="Automática"
            aria-label="Posição na linha do tempo"
            className={inputCls}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CamposDataInputs
          rotulo="Início"
          campos={form.inicio}
          nivel={nivelEscala}
          aoAlterar={(inicio) => setForm({ ...form, inicio })}
        />
        <CamposDataInputs
          rotulo="Fim"
          campos={form.fim}
          nivel={nivelEscala}
          aoAlterar={(fim) => setForm({ ...form, fim })}
        />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className={btnPrimario}>
          {enviando ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={aoCancelar} className={btnSecundario}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function GerenciadorLinhaDoTempo({
  obraId,
  eventosIniciais,
  capitulos,
}: {
  obraId: string;
  eventosIniciais: EventoDados[];
  capitulos: CapituloResumo[];
}) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function criar(corpo: Record<string, unknown>) {
    const erro = await requisicao(`/api/obras/${obraId}/eventos`, "POST", corpo);
    if (erro) return erro;
    setCriando(false);
    router.refresh();
    return null;
  }

  async function editar(id: string, corpo: Record<string, unknown>) {
    const erro = await requisicao(`/api/eventos/${id}`, "PATCH", corpo);
    if (erro) return erro;
    setEditandoId(null);
    router.refresh();
    return null;
  }

  async function excluir(id: string, titulo: string) {
    if (!confirm(`Excluir o evento "${titulo}"?`)) return;
    setErroGeral(null);
    const erro = await requisicao(`/api/eventos/${id}`, "DELETE");
    if (erro) {
      setErroGeral(erro);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!criando && (
        <button onClick={() => setCriando(true)} className={btnPrimario}>
          + Novo evento
        </button>
      )}
      {criando && (
        <div className={cardCls}>
          <h3 className="mb-3 font-semibold">Novo evento</h3>
          <FormEvento
            capitulos={capitulos}
            aoSalvar={criar}
            aoCancelar={() => setCriando(false)}
          />
        </div>
      )}

      {erroGeral && <p className="text-sm text-red-600">{erroGeral}</p>}

      {eventosIniciais.length === 0 && !criando && (
        <p className="text-sm text-muted">
          Nenhum evento cadastrado. Crie o primeiro marco da sua história.
        </p>
      )}

      {/* Linha do tempo vertical */}
      <ol className="relative ml-2 space-y-4 border-l border-line pl-6">
        {eventosIniciais.map((ev) => (
          <li key={ev.id} className="relative">
            {/* Marcador sobre a linha */}
            <span
              aria-hidden
              className="absolute top-5 -left-[1.9rem] h-3 w-3 rounded-full border-2 border-line bg-accent"
            />
            {editandoId === ev.id ? (
              <div className={cardCls}>
                <h3 className="mb-3 font-semibold">Editar evento</h3>
                <FormEvento
                  inicial={ev}
                  capitulos={capitulos}
                  aoSalvar={(corpo) => editar(ev.id, corpo)}
                  aoCancelar={() => setEditandoId(null)}
                />
              </div>
            ) : (
              <div className={`${cardCls} flex items-start justify-between gap-4 py-3`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block rounded-full bg-chipbg px-2 py-0.5 text-xs text-soft">
                      #{ev.ordemCronologica + 1}
                    </span>
                    <h3 className="font-semibold">{ev.titulo}</h3>
                    <span className="text-xs text-faint">
                      {ROTULO_ESCALA_TEMPORAL[ev.escalaTemporal] ?? ev.escalaTemporal}
                    </span>
                  </div>
                  {Boolean(ev.dataInicio || ev.dataFim) && (
                    <p className="mt-1 text-sm text-soft">
                      {formatarData(ev.dataInicio) || "?"}
                      {" → "}
                      {formatarData(ev.dataFim) || "?"}
                    </p>
                  )}
                  {ev.descricao && <p className="mt-2 text-sm">{ev.descricao}</p>}
                  {ev.capituloTitulo && (
                    <p className="mt-1 text-xs text-muted">📚 {ev.capituloTitulo}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => setEditandoId(ev.id)} className={btnSecundario}>
                    Editar
                  </button>
                  <button onClick={() => excluir(ev.id, ev.titulo)} className={btnPerigo}>
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
