"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimario, btnSecundario } from "@/components/ui";

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
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>(() => {
    const mapa: Record<string, string> = {};
    for (const c of CAMPOS) mapa[c.nome] = inicial[c.nome] ?? "";
    return mapa;
  });
  // Campos que chegaram como sugestão da IA e ainda não foram salvos
  const [sugeridos, setSugeridos] = useState<Set<string>>(new Set());
  const [sugerindo, setSugerindo] = useState(false);
  const [erroSugestao, setErroSugestao] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function sugerir() {
    setErroSugestao(null);
    setSugerindo(true);
    try {
      const res = await fetch(`/api/obras/${obraId}/esqueleto/sugerir`, {
        method: "POST",
      });
      const corpo = (await res.json().catch(() => null)) as
        | Record<string, string>
        | { erro?: string }
        | null;
      if (!res.ok || !corpo || "erro" in corpo)
        throw new Error(
          (corpo as { erro?: string })?.erro ?? "Falha na sugestão.",
        );
      // Só preenche campos vazios — nunca sobrescreve o que o autor escreveu
      const novos = new Set<string>();
      setValores((m) => {
        const atualizado = { ...m };
        for (const [campo, valor] of Object.entries(corpo)) {
          if (!m[campo]?.trim()) {
            atualizado[campo] = valor;
            novos.add(campo);
          }
        }
        return atualizado;
      });
      setSugeridos(novos);
    } catch (e) {
      setErroSugestao(e instanceof Error ? e.message : "Falha na sugestão.");
    } finally {
      setSugerindo(false);
    }
  }

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/obras/${obraId}/esqueleto`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      });
      if (res.ok) {
        setFeedback("Esqueleto salvo.");
        setSugeridos(new Set()); // aceito → para de marcar como sugestão
        router.refresh();
      } else {
        setFeedback("Erro ao salvar. Verifique os dados.");
      }
    } catch {
      setFeedback("Falha de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  function descartarSugestao(campo: string) {
    setValores((m) => ({ ...m, [campo]: "" }));
    setSugeridos((s) => {
      const novo = new Set(s);
      novo.delete(campo);
      return novo;
    });
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-4">
      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={sugerir}
            disabled={sugerindo}
            className={btnSecundario}
            title="A IA propõe os campos vazios com base no que já foi escrito; você revisa e salva"
          >
            {sugerindo
              ? "⏳ Analisando a história… pode levar até 5 min"
              : "🧠 Autoformar com base no que já escrevi"}
          </button>
          <span className="text-xs text-muted">
            Preenche apenas campos vazios, como rascunho — nada é salvo sem você
            clicar em “Salvar esqueleto”
          </span>
        </div>
        {erroSugestao && (
          <p className="mt-2 text-sm text-red-600">{erroSugestao}</p>
        )}
      </div>

      {CAMPOS.map((campo) => (
        <div key={campo.nome}>
          <label htmlFor={campo.nome} className={labelCls}>
            {campo.rotulo}
            {sugeridos.has(campo.nome) && (
              <span className="ml-2 rounded bg-hoverbg px-1.5 py-0.5 text-xs font-normal text-muted">
                ✨ sugestão da IA — revise
                <button
                  type="button"
                  onClick={() => descartarSugestao(campo.nome)}
                  className="ml-1 underline hover:text-foreground"
                >
                  descartar
                </button>
              </span>
            )}
          </label>
          <textarea
            id={campo.nome}
            rows={campo.linhas ?? 3}
            value={valores[campo.nome]}
            onChange={(e) =>
              setValores((m) => ({ ...m, [campo.nome]: e.target.value }))
            }
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
