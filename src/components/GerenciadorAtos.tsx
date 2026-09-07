"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimario, btnSecundario, btnPerigo, cardCls } from "@/components/ui";
import { EstadoVazio } from "@/components/EstadoVazio";
import { GRAFIC } from "@/lib/grafic";

export type AtoDados = {
  id: string;
  titulo: string;
  sinopse: string | null;
  ordem: number;
  capitulos: Array<{ id: string; titulo: string; ordemDentroDoAto: number | null }>;
};

function FormAto({
  inicial,
  aoSalvar,
  aoCancelar,
}: {
  inicial?: { titulo: string; sinopse: string | null };
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
        <label className={labelCls}>Título *</label>
        <input name="titulo" required maxLength={200} defaultValue={inicial?.titulo} placeholder='Ex.: "Ato I — O mundo comum"' className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Sinopse</label>
        <textarea
          name="sinopse"
          rows={2}
          maxLength={3000}
          placeholder="Resumo do que acontece neste ato (opcional)"
          defaultValue={inicial?.sinopse ?? ""}
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

export function GerenciadorAtos({
  obraId,
  atos,
  capitulosSemAto,
}: {
  obraId: string;
  atos: AtoDados[];
  capitulosSemAto: Array<{ id: string; titulo: string }>;
}) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [atribuindoAtoId, setAtribuindoAtoId] = useState<string | null>(null);
  const [capituloSelecionado, setCapituloSelecionado] = useState<string>("");
  const [ocupado, setOcupado] = useState(false);

  async function criar(corpo: Record<string, unknown>) {
    await requisicao(`/api/obras/${obraId}/atos`, "POST", corpo);
    setCriando(false);
    router.refresh();
  }

  async function editar(id: string, corpo: Record<string, unknown>) {
    await requisicao(`/api/atos/${id}`, "PATCH", corpo);
    setEditandoId(null);
    router.refresh();
  }

  async function excluir(id: string, titulo: string) {
    if (
      !confirm(
        `Excluir o ato "${titulo}"? Os capítulos desse ato ficarão sem ato (nada é apagado).`,
      )
    )
      return;
    await requisicao(`/api/atos/${id}`, "DELETE");
    router.refresh();
  }

  async function atribuirCapitulo(atoId: string, capituloId: string) {
    setOcupado(true);
    try {
      await requisicao(`/api/capitulos/${capituloId}`, "PATCH", { atoId });
      setAtribuindoAtoId(null);
      setCapituloSelecionado("");
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  async function removerDoAto(capituloId: string) {
    setOcupado(true);
    try {
      await requisicao(`/api/capitulos/${capituloId}`, "PATCH", { atoId: null });
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  const semAtos = atos.length === 0;

  return (
    <div className="space-y-4">
      {!criando && (
        <button onClick={() => setCriando(true)} className={btnPrimario}>
          + Novo ato
        </button>
      )}
      {criando && (
        <div className={cardCls}>
          <h3 className="mb-3 font-semibold">Novo ato</h3>
          <FormAto aoSalvar={criar} aoCancelar={() => setCriando(false)} />
        </div>
      )}

      {semAtos && !criando && (
        <EstadoVazio
          src={GRAFIC.vazioDashboard}
          alt="Nenhum ato cadastrado"
          mensagem="Nenhum ato cadastrado. Crie atos para agrupar os capítulos da narrativa (ex.: 3 atos clássicos) — a ordenação dos capítulos não muda."
        />
      )}

      {atos.map((ato, indice) => (
        <div key={ato.id} className={`${cardCls} space-y-3`}>
          {editandoId === ato.id ? (
            <FormAto
              inicial={{ titulo: ato.titulo, sinopse: ato.sinopse }}
              aoSalvar={(corpo) => editar(ato.id, corpo)}
              aoCancelar={() => setEditandoId(null)}
            />
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">
                  <span className="mr-2 rounded-full bg-chipbg px-2 py-0.5 text-xs font-normal text-soft">
                    Ato {indice + 1}
                  </span>
                  {ato.titulo}
                </h3>
                {ato.sinopse && <p className="mt-1 text-sm text-muted">{ato.sinopse}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => setEditandoId(ato.id)} className={btnSecundario}>
                  Editar
                </button>
                <button onClick={() => excluir(ato.id, ato.titulo)} className={btnPerigo}>
                  Excluir
                </button>
              </div>
            </div>
          )}

          {/* Capítulos deste ato */}
          {ato.capitulos.length > 0 ? (
            <ul className="space-y-1 rounded-md border border-line bg-surface p-2">
              {ato.capitulos.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <span className="mr-2 text-faint">{c.ordemDentroDoAto ?? "—"}</span>
                    <span className="font-medium">{c.titulo}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removerDoAto(c.id)}
                    disabled={ocupado}
                    className={btnSecundario}
                    aria-label={`Remover ${c.titulo} deste ato`}
                  >
                    ✖
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted">Nenhum capítulo neste ato ainda.</p>
          )}

          {/* Atribuir capítulo a este ato */}
          {atribuindoAtoId === ato.id ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface-elevated p-2">
              <select
                value={capituloSelecionado}
                onChange={(e) => setCapituloSelecionado(e.target.value)}
                className={`${inputCls} flex-1`}
                aria-label="Capítulo para adicionar ao ato"
              >
                <option value="">Selecione um capítulo…</option>
                {capitulosSemAto.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titulo}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => atribuirCapitulo(ato.id, capituloSelecionado)}
                disabled={ocupado || !capituloSelecionado}
                className={btnPrimario}
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAtribuindoAtoId(null);
                  setCapituloSelecionado("");
                }}
                disabled={ocupado}
                className={btnSecundario}
              >
                Cancelar
              </button>
            </div>
          ) : (
            capitulosSemAto.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setAtribuindoAtoId(ato.id);
                  setCapituloSelecionado("");
                }}
                className={btnSecundario}
              >
                + Adicionar capítulo a este ato
              </button>
            )
          )}
        </div>
      ))}

      {!semAtos && capitulosSemAto.length > 0 && (
        <p className="text-xs text-muted">
          {capitulosSemAto.length} capítulo(s) ainda sem ato — use "Adicionar capítulo" no ato desejado.
        </p>
      )}
    </div>
  );
}