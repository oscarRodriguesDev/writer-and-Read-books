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

/** Botão "+" posicionado sobre a linha para inserir evento naquele ponto. */
function BotaoInserir({ aoClicar }: { aoClicar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      title="Adicionar acontecimento neste ponto da linha do tempo"
      aria-label="Adicionar acontecimento neste ponto"
      className="absolute -left-[2.35rem] flex h-6 w-6 items-center justify-center rounded-full border-2 border-line bg-surface text-sm font-bold text-muted transition hover:border-accent hover:text-accent"
    >
      +
    </button>
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

  // ---- Mapeamento da linha do tempo via IA (RF-20/21/74) ----
  const [mapeando, setMapeando] = useState(false);
  const [resumoMapeamento, setResumoMapeamento] = useState<string | null>(null);

  async function mapear() {
    if (
      !window.confirm(
        "A IA vai ler toda a obra escrita e CADASTRAR os acontecimentos que ainda não estão na linha do tempo (em ordem cronológica). Continuar?",
      )
    )
      return;
    setMapeando(true);
    setResumoMapeamento(null);
    try {
      const res = await fetch(`/api/obras/${obraId}/eventos/mapear`, {
        method: "POST",
      });
      const corpo = (await res.json().catch(() => null)) as
        | {
            existentes?: Array<{ titulo: string }>;
            criados?: Array<{ titulo: string }>;
            erro?: string;
          }
        | null;
      if (!res.ok || !corpo)
        throw new Error(corpo?.erro ?? "Falha no mapeamento.");
      const partes: string[] = [];
      if (corpo.criados?.length)
        partes.push(`🆕 Criados: ${corpo.criados.map((e) => e.titulo).join(", ")}`);
      if (corpo.existentes?.length)
        partes.push(`✅ Confirmados: ${corpo.existentes.map((e) => e.titulo).join(", ")}`);
      setResumoMapeamento(
        partes.length > 0 ? partes.join(" · ") : "Nada novo extraído do texto.",
      );
      router.refresh();
    } catch (e) {
      setResumoMapeamento(e instanceof Error ? e.message : "Falha no mapeamento.");
    } finally {
      setMapeando(false);
    }
  }

  // ---- Inserção num ponto específico da linha (clique no "+") ----
  const [inserindoEm, setInserindoEm] = useState<number | null>(null);

  async function inserir(corpo: Record<string, unknown>) {
    const erro = await requisicao(
      `/api/obras/${obraId}/eventos/inserir`,
      "POST",
      corpo,
    );
    if (erro) return erro;
    setInserindoEm(null);
    router.refresh();
    // Após inserir, abre a sugestão de capítulos para o novo acontecimento
    const recemCriado = await fetch(`/api/obras/${obraId}/eventos`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    if (Array.isArray(recemCriado)) {
      const alvo = recemCriado.find(
        (e: { ordemCronologica: number }) =>
          e.ordemCronologica === Number(corpo.ordemCronologica),
      );
      if (alvo?.id) void sugerirPara(alvo.id);
    }
    return null;
  }

  // ---- Sugestão de capítulos para apoiar um acontecimento ----
  type Sugestoes = {
    criar: Array<{ titulo: string; objetivo: string | null; motivo: string }>;
    alterar: Array<{ id: string; titulo: string | null; objetivo: string | null; motivo: string }>;
  };
  const [sugestaoDe, setSugestaoDe] = useState<string | null>(null);
  const [carregandoSugestao, setCarregandoSugestao] = useState(false);
  const [sugestoes, setSugestoes] = useState<Sugestoes | null>(null);

  async function sugerirPara(eventoId: string) {
    setSugestaoDe(eventoId);
    setCarregandoSugestao(true);
    setSugestoes(null);
    try {
      const res = await fetch(`/api/obras/${obraId}/eventos/sugerir-capitulos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventoId }),
      });
      const corpo = (await res.json().catch(() => null)) as
        | (Sugestoes & { erro?: string })
        | null;
      if (!res.ok || !corpo)
        throw new Error(corpo?.erro ?? "Falha na sugestão.");
      setSugestoes({
        criar: corpo.criar ?? [],
        alterar: corpo.alterar ?? [],
      });
      router.refresh();
    } catch (e) {
      setErroGeral(e instanceof Error ? e.message : "Falha na sugestão.");
      setSugestaoDe(null);
    } finally {
      setCarregandoSugestao(false);
    }
  }

  async function aceitarCriacao(sug: { titulo: string; objetivo: string | null }) {
    if (!sugestaoDe) return;
    const erro = await requisicao(`/api/obras/${obraId}/capitulos`, "POST", {
      titulo: sug.titulo,
      ...(sug.objetivo ? { objetivo: sug.objetivo } : {}),
    });
    if (erro) {
      setErroGeral(erro);
      return;
    }
    // Vincula o capítulo recém-criado ao acontecimento
    await fetch(`/api/obras/${obraId}/capitulos`)
      .then((r) => r.json())
      .then(async (lista: Array<{ id: string; titulo: string }>) => {
        const criado = lista.find((c) => c.titulo === sug.titulo);
        if (criado)
          await requisicao(`/api/eventos/${sugestaoDe}`, "PATCH", {
            capituloId: criado.id,
          });
      });
    setSugestaoDe(null);
    setSugestoes(null);
    router.refresh();
  }

  async function aceitarAlteracao(sug: {
    id: string;
    titulo: string | null;
    objetivo: string | null;
  }) {
    const corpo: Record<string, unknown> = {};
    if (sug.titulo) corpo.titulo = sug.titulo;
    if (sug.objetivo) corpo.objetivo = sug.objetivo;
    const erro = await requisicao(`/api/capitulos/${sug.id}`, "PATCH", corpo);
    if (erro) {
      setErroGeral(erro);
      return;
    }
    setSugestaoDe(null);
    setSugestoes(null);
    router.refresh();
  }

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
      {/* Mapeamento da linha do tempo via IA */}
      <div className={`${cardCls} space-y-2`}>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={mapear}
            disabled={mapeando}
            className={btnPrimario}
          >
            {mapeando ? "⏳ Analisando a obra inteira…" : "🧠 Gerar linha do tempo a partir do texto"}
          </button>
          {!criando && inserindoEm === null && (
            <button onClick={() => setCriando(true)} className={btnSecundario}>
              + Novo evento
            </button>
          )}
        </div>
        {resumoMapeamento && (
          <p className="rounded-md border border-line bg-surface p-2 text-xs text-muted">
            {resumoMapeamento}
          </p>
        )}
      </div>

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

      {/* Inserção em ponto específico da linha */}
      {inserindoEm !== null && (
        <div className={`${cardCls} border-accent`}>
          <h3 className="mb-3 font-semibold">
            Novo acontecimento na posição #{inserindoEm + 1}
          </h3>
          <FormEvento
            inicial={{
              id: "",
              titulo: "",
              descricao: null,
              escalaTemporal: "INDEFINIDO",
              dataInicio: null,
              dataFim: null,
              ordemCronologica: inserindoEm,
              capituloId: null,
              capituloTitulo: null,
            }}
            capitulos={capitulos}
            aoSalvar={inserir}
            aoCancelar={() => setInserindoEm(null)}
          />
        </div>
      )}

      {erroGeral && <p className="text-sm text-red-600">{erroGeral}</p>}

      {eventosIniciais.length === 0 && !criando && (
        <p className="text-sm text-muted">
          Nenhum evento cadastrado. Crie o primeiro marco da sua história.
        </p>
      )}

      {/* Linha do tempo vertical gráfica */}
      <ol className="relative ml-4 space-y-2 border-l-2 border-line pl-6">
        {/* Ponto de inserção no início da linha */}
        <li className="relative -my-1">
          <BotaoInserir
            aoClicar={() =>
              setInserindoEm(eventosIniciais[0]?.ordemCronologica ?? 0)
            }
          />
        </li>
        {eventosIniciais.map((ev, i) => (
          <li key={ev.id} className="relative">
            {/* Marcador colorido sobre a linha, conforme a escala */}
            <span
              aria-hidden
              title={ROTULO_ESCALA_TEMPORAL[ev.escalaTemporal] ?? ev.escalaTemporal}
              className={`absolute top-6 -left-[1.95rem] h-3.5 w-3.5 rounded-full border-2 border-line ${
                ev.capituloId ? "bg-accent" : "bg-faint"
              }`}
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
              <>
                <div className={`${cardCls} group py-3 transition hover:border-faint`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-onaccent">
                          {ev.ordemCronologica + 1}
                        </span>
                        <h3 className="font-semibold">{ev.titulo}</h3>
                        <span className="rounded-full bg-chipbg px-2 py-0.5 text-xs text-soft">
                          {ROTULO_ESCALA_TEMPORAL[ev.escalaTemporal] ?? ev.escalaTemporal}
                        </span>
                        {Boolean(ev.dataInicio || ev.dataFim) && (
                          <span className="rounded-full bg-chipbg px-2 py-0.5 text-xs font-medium text-soft">
                            📅 {formatarData(ev.dataInicio) || "?"}
                            {(ev.dataInicio && ev.dataFim) || (!ev.dataInicio && ev.dataFim)
                              ? ` → ${formatarData(ev.dataFim) || "?"}`
                              : ""}
                          </span>
                        )}
                      </div>
                      {ev.descricao && (
                        <p className="mt-2 text-sm">{ev.descricao}</p>
                      )}
                      {ev.capituloTitulo && (
                        <p className="mt-1 text-xs text-muted">📚 {ev.capituloTitulo}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <button onClick={() => setEditandoId(ev.id)} className={btnSecundario}>
                        Editar
                      </button>
                      <button
                        onClick={() => sugerirPara(ev.id)}
                        disabled={carregandoSugestao}
                        className={btnSecundario}
                        title="A IA sugere capítulos para apoiar este acontecimento"
                      >
                        🧠 Sugerir capítulos
                      </button>
                      <button onClick={() => excluir(ev.id, ev.titulo)} className={btnPerigo}>
                        Excluir
                      </button>
                    </div>
                  </div>

                  {/* Painel de sugestão de capítulos */}
                  {sugestaoDe === ev.id && (
                    <div className="mt-3 rounded-md border border-line bg-surface p-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">
                        Sugestões para apoiar “{ev.titulo}” — aceite o que fizer sentido
                      </p>
                      {carregandoSugestao && (
                        <p className="text-xs text-muted">
                          ⏳ A IA está analisando a estrutura da obra…
                        </p>
                      )}
                      {sugestoes && (
                        <div className="space-y-2">
                          {sugestoes.criar.length === 0 &&
                            sugestoes.alterar.length === 0 && (
                              <p className="text-xs text-muted">
                                Nenhum ajuste necessário: a estrutura atual já apoia este acontecimento.
                              </p>
                            )}
                          {sugestoes.criar.map((s) => (
                            <div key={s.titulo} className="rounded-md border border-line p-2">
                              <p className="text-sm font-medium">➕ Criar capítulo: {s.titulo}</p>
                              {s.objetivo && <p className="text-xs text-muted">Objetivo: {s.objetivo}</p>}
                              {s.motivo && <p className="text-xs text-muted">💡 {s.motivo}</p>}
                              <button
                                type="button"
                                onClick={() => aceitarCriacao(s)}
                                className={`mt-1 ${btnSecundario}`}
                              >
                                Aceitar e criar
                              </button>
                            </div>
                          ))}
                          {sugestoes.alterar.map((s) => {
                            const alvo = capitulos.find((c) => c.id === s.id);
                            return (
                              <div key={s.id} className="rounded-md border border-line p-2">
                                <p className="text-sm font-medium">
                                  ✏️ Alterar: {alvo?.titulo ?? s.id}
                                </p>
                                {s.titulo && <p className="text-xs text-muted">Novo título: {s.titulo}</p>}
                                {s.objetivo && <p className="text-xs text-muted">Novo objetivo: {s.objetivo}</p>}
                                {s.motivo && <p className="text-xs text-muted">💡 {s.motivo}</p>}
                                <button
                                  type="button"
                                  onClick={() => aceitarAlteracao(s)}
                                  className={`mt-1 ${btnSecundario}`}
                                >
                                  Aceitar alteração
                                </button>
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              setSugestaoDe(null);
                              setSugestoes(null);
                            }}
                            className="text-xs text-muted underline hover:text-foreground"
                          >
                            fechar sugestões
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ponto de inserção entre este evento e o próximo */}
                {i < eventosIniciais.length - 1 && (
                  <BotaoInserir
                    aoClicar={() =>
                      setInserindoEm(eventosIniciais[i + 1].ordemCronologica)
                    }
                  />
                )}
              </>
            )}
          </li>
        ))}
        {/* Inserção no fim da linha */}
        {eventosIniciais.length > 0 && (
          <li className="relative -my-1">
            <BotaoInserir
              aoClicar={() =>
                setInserindoEm(
                  eventosIniciais[eventosIniciais.length - 1].ordemCronologica + 1,
                )
              }
            />
          </li>
        )}
      </ol>
    </div>
  );
}
