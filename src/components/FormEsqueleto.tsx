"use client";

import { useState } from "react";
import { inputCls, labelCls, btnPrimario } from "@/components/ui";

type EsqueletoParcial = Partial<{
  premissa: string | null;
  conflitoPrincipal: string | null;
  conflitosSecundarios: string | null;
  objetivoProtagonista: string | null;
  transformacaoProtagonista: string | null;
  eventosPrincipais: string | null;
  pontosVirada: string | null;
  climax: string | null;
  desfecho: string | null;
}>;

const CAMPOS: { nome: keyof EsqueletoParcial; rotulo: string; linhas?: number }[] = [
  { nome: "premissa", rotulo: "Premissa", linhas: 3 },
  { nome: "conflitoPrincipal", rotulo: "Conflito principal", linhas: 3 },
  { nome: "conflitosSecundarios", rotulo: "Conflitos secundários", linhas: 3 },
  { nome: "objetivoProtagonista", rotulo: "Objetivo do protagonista", linhas: 2 },
  { nome: "transformacaoProtagonista", rotulo: "Transformação do protagonista", linhas: 2 },
  { nome: "eventosPrincipais", rotulo: "Eventos principais", linhas: 4 },
  { nome: "pontosVirada", rotulo: "Pontos de virada", linhas: 4 },
  { nome: "climax", rotulo: "Clímax", linhas: 3 },
  { nome: "desfecho", rotulo: "Desfecho", linhas: 3 },
];

export function FormEsqueleto({
  obraId,
  inicial,
}: {
  obraId: string;
  inicial: EsqueletoParcial;
}) {
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const corpo = Object.fromEntries(CAMPOS.map((c) => [c.nome, form.get(c.nome)]));
    setSalvando(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/obras/${obraId}/esqueleto`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      setFeedback(res.ok ? "Esqueleto salvo." : "Erro ao salvar. Verifique os dados.");
    } catch {
      setFeedback("Falha de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-4">
      {CAMPOS.map((campo) => (
        <div key={campo.nome}>
          <label htmlFor={campo.nome} className={labelCls}>
            {campo.rotulo}
          </label>
          <textarea
            id={campo.nome}
            name={campo.nome}
            rows={campo.linhas ?? 3}
            defaultValue={inicial[campo.nome] ?? ""}
            className={inputCls}
          />
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={salvando} className={btnPrimario}>
          {salvando ? "Salvando…" : "Salvar esqueleto"}
        </button>
        {feedback && <span className="text-sm text-muted">{feedback}</span>}
      </div>
    </form>
  );
}
