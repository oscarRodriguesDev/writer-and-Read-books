"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimario, btnSecundario, btnPerigo, cardCls } from "@/components/ui";
import { EstadoVazio } from "@/components/EstadoVazio";
import { GRAFIC } from "@/lib/grafic";

type RegraDados = {
  id: string;
  descricao: string;
  ativa: boolean;
};

/** Regras do universo da obra — cadastro, ativação e exclusão. */
export function GerenciadorRegras({
  obraId,
  iniciais,
}: {
  obraId: string;
  iniciais: RegraDados[];
}) {
  const router = useRouter();
  const [regras, setRegras] = useState<RegraDados[]>(iniciais);
  const [descricao, setDescricao] = useState("");
  const [criando, setCriando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function criar() {
    if (!descricao.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/obras/${obraId}/regras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: descricao.trim(), ativa: true }),
      });
      const corpo = (await res.json().catch(() => null)) as { erro?: string } | null;
      if (!res.ok) throw new Error(corpo?.erro ?? "Falha ao salvar a regra.");
      setDescricao("");
      setCriando(false);
      router.refresh();
      const r = corpo as RegraDados;
      setRegras((lista) => [...lista, r]);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar a regra.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtiva(regra: RegraDados) {
    setRegras((lista) =>
      lista.map((r) => (r.id === regra.id ? { ...r, ativa: !r.ativa } : r)),
    );
    try {
      const res = await fetch(`/api/regras/${regra.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativa: !regra.ativa }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setErro("Não foi possível atualizar a regra.");
      setRegras((lista) =>
        lista.map((r) => (r.id === regra.id ? { ...r, ativa: regra.ativa } : r)),
      );
    }
  }

  async function excluir(regra: RegraDados) {
    if (!confirm(`Excluir a regra "${regra.descricao.slice(0, 60)}…"?`)) return;
    try {
      const res = await fetch(`/api/regras/${regra.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setRegras((lista) => lista.filter((r) => r.id !== regra.id));
      router.refresh();
    } catch {
      setErro("Não foi possível excluir a regra.");
    }
  }

  return (
    <div className="space-y-4">
      <div className={`${cardCls} space-y-2`}>
        <p className="text-sm text-muted">
          Regras do seu mundo que a IA deve respeitar ao gerar, revisar e analisar
          cenas (ex.: “magia exige foco”, “dragões não podem mentir”).
        </p>
        {!criando && (
          <button onClick={() => setCriando(true)} className={btnPrimario}>
            + Nova regra
          </button>
        )}
        {criando && (
          <div className="space-y-2">
            <label className={labelCls}>Descrição da regra *</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              maxLength={3000}
              placeholder="Ex.: A magia consome energia vital de quem a usa."
              className={inputCls}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={criar}
                disabled={salvando || !descricao.trim()}
                className={btnPrimario}
              >
                {salvando ? "Salvando…" : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCriando(false);
                  setDescricao("");
                  setErro(null);
                }}
                className={btnSecundario}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </div>

      {regras.length === 0 && !criando ? (
        <EstadoVazio
          src={GRAFIC.vazioAmbientes}
          alt="Nenhuma regra cadastrada"
          mensagem="Nenhuma regra cadastrada. Defina as leis do seu universo."
        />
      ) : (
        <ul className="space-y-2">
          {regras.map((regra) => (
            <li
              key={regra.id}
              className={`${cardCls} flex items-start justify-between gap-3 ${
                regra.ativa ? "" : "opacity-60"
              }`}
            >
              <div className="min-w-0">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                    regra.ativa
                      ? "bg-success-light text-success"
                      : "bg-chipbg text-muted"
                  }`}
                >
                  {regra.ativa ? "Ativa" : "Inativa"}
                </span>
                <p className="mt-1 text-sm">{regra.descricao}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <button
                  type="button"
                  onClick={() => alternarAtiva(regra)}
                  className={btnSecundario}
                >
                  {regra.ativa ? "Desativar" : "Ativar"}
                </button>
                <button type="button" onClick={() => excluir(regra)} className={btnPerigo}>
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}