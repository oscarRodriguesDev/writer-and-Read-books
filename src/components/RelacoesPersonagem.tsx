"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TIPOS_RELACAO, ROTULO_TIPO_RELACAO } from "@/lib/constants";
import { inputCls, labelCls, btnPrimario, btnSecundario, btnPerigo, cardCls } from "@/components/ui";

type RelacaoApi = {
  id: string;
  origemId: string;
  destinoId: string;
  tipo: string;
  descricao: string | null;
  origem: { id: string; nome: string };
  destino: { id: string; nome: string };
};

type Props = {
  obraId: string;
  personagemId: string;
  personagemNome: string;
  /** Outros personagens disponíveis para virar destino de uma relação nova. */
  outros: Array<{ id: string; nome: string }>;
};

/** Seção "Relações" dentro do card de um personagem. */
export function RelacoesPersonagem({ obraId, personagemId, personagemNome, outros }: Props) {
  const router = useRouter();
  const [relacoes, setRelacoes] = useState<RelacaoApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [novoDestino, setNovoDestino] = useState("");
  const [novoTipo, setNovoTipo] = useState<string>("OUTRO");
  const [novaDescricao, setNovaDescricao] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/personagens/${personagemId}/relacoes`);
      if (!res.ok) throw new Error();
      setRelacoes(await res.json());
    } catch {
      setErro("Não foi possível carregar as relações.");
    } finally {
      setCarregando(false);
    }
  }, [personagemId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function criar() {
    if (!novoDestino) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/obras/${obraId}/relacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origemId: personagemId,
          destinoId: novoDestino,
          tipo: novoTipo,
          descricao: novaDescricao || null,
        }),
      });
      const corpo = (await res.json().catch(() => null)) as { erro?: string } | null;
      if (!res.ok) throw new Error(corpo?.erro ?? "Falha ao salvar relação.");
      setNovoDestino("");
      setNovaDescricao("");
      await carregar();
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar relação.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string, rotulo: string) {
    if (!confirm(`Remover a relação "${rotulo}"?`)) return;
    try {
      const res = await fetch(`/api/relacoes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await carregar();
      router.refresh();
    } catch {
      setErro("Não foi possível remover a relação.");
    }
  }

  function rotuloRela(rel: RelacaoApi) {
    const outro =
      rel.origemId === personagemId ? rel.destino.nome : rel.origem.nome;
    return `${personagemNome} ↔ ${outro} (${ROTULO_TIPO_RELACAO[rel.tipo as keyof typeof ROTULO_TIPO_RELACAO] ?? rel.tipo})`;
  }

  return (
    <div className="mt-3 rounded-lg border border-line bg-surface-elevated p-3">
      <h4 className="text-sm font-semibold">🔗 Relações</h4>

      {carregando ? (
        <p className="mt-2 text-xs text-muted">Carregando…</p>
      ) : relacoes.length === 0 ? (
        <p className="mt-2 text-xs text-muted">
          Nenhuma relação cadastrada para {personagemNome}.
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {relacoes.map((rel) => (
            <li
              key={rel.id}
              className="flex items-center justify-between gap-2 rounded-md bg-surface px-2 py-1.5 text-sm"
            >
              <span className="min-w-0">
                <span className="font-medium">{personagemNome}</span>
                <span className="mx-1.5 text-muted">↔</span>
                <span className="font-medium">
                  {rel.origemId === personagemId ? rel.destino.nome : rel.origem.nome}
                </span>
                <span className="ml-2 inline-block rounded-full bg-chipbg px-2 py-0.5 text-xs text-soft">
                  {ROTULO_TIPO_RELACAO[rel.tipo as keyof typeof ROTULO_TIPO_RELACAO] ?? rel.tipo}
                </span>
                {rel.descricao && (
                  <span className="mt-0.5 block text-xs text-muted">{rel.descricao}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => excluir(rel.id, rotuloRela(rel))}
                className={btnPerigo}
                aria-label={`Remover relação com ${rel.origemId === personagemId ? rel.destino.nome : rel.origem.nome}`}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 space-y-2">
        <label className={labelCls}>Adicionar relação</label>
        <select
          value={novoDestino}
          onChange={(e) => setNovoDestino(e.target.value)}
          className={inputCls}
          aria-label="Personagem de destino da relação"
        >
          <option value="">Selecione um personagem…</option>
          {outros.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <select
          value={novoTipo}
          onChange={(e) => setNovoTipo(e.target.value)}
          className={inputCls}
          aria-label="Tipo da relação"
        >
          {TIPOS_RELACAO.map((t) => (
            <option key={t} value={t}>
              {ROTULO_TIPO_RELACAO[t]}
            </option>
          ))}
        </select>
        <input
          value={novaDescricao}
          onChange={(e) => setNovaDescricao(e.target.value)}
          maxLength={1000}
          placeholder="Descrição (opcional, ex.: 'irmã mais nova, mora com a avó')"
          className={inputCls}
        />
        <button
          type="button"
          onClick={criar}
          disabled={salvando || !novoDestino}
          className={btnPrimario}
        >
          {salvando ? "Salvando…" : "+ Adicionar relação"}
        </button>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </div>
    </div>
  );
}