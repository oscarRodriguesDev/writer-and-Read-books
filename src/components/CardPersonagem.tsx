"use client";

import { useState } from "react";
import { ROTULO_PAPEL } from "@/lib/constants";
import { btnSecundario, btnPerigo, cardCls } from "@/components/ui";
import { ImagemEntidade } from "@/components/ImagemEntidade";
import { BotaoPromptImagem } from "@/components/BotaoPromptImagem";
import { RelacoesPersonagem } from "@/components/RelacoesPersonagem";
import type { PersonagemDados } from "@/components/GerenciadorPersonagens";

const CAMPOS_PERFIL: Array<{ chave: keyof PersonagemDados; rotulo: string }> = [
  { chave: "objetivo", rotulo: "Objetivo" },
  { chave: "fisico", rotulo: "Físico" },
  { chave: "psicologico", rotulo: "Psicológico" },
  { chave: "comportamento", rotulo: "Comportamento" },
  { chave: "historia", rotulo: "História" },
];

type Props = {
  obraId: string;
  personagem: PersonagemDados;
  relevancia?: number | null;
  motivo?: string | null;
  outros: Array<{ id: string; nome: string }>;
  aoEditar: () => void;
  aoExcluir: () => void;
};

/**
 * Card do personagem organizado em abas:
 * "Perfil" (imagem + objetivo/físico/psicológico/comportamento/história)
 * e "Relações".
 */
export function CardPersonagem({
  obraId,
  personagem: p,
  relevancia,
  motivo,
  outros,
  aoEditar,
  aoExcluir,
}: Props) {
  const [aba, setAba] = useState<"perfil" | "relacoes">("perfil");

  const abaCls = (ativa: boolean) =>
    `rounded-md px-3 py-1.5 text-sm ${
      ativa
        ? "bg-hoverbg font-semibold text-foreground"
        : "text-muted hover:text-foreground"
    }`;

  return (
    <div className={`${cardCls} space-y-3`}>
      {/* Cabeçalho: nome + papel + ações */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold">
            {p.nome}
            {relevancia !== null && relevancia !== undefined && (
              <span className="ml-2 rounded-full bg-chipbg px-2 py-0.5 text-xs font-normal text-soft">
                ✨ {relevancia}% relevante
              </span>
            )}
          </h3>
          <span className="mt-1 inline-block rounded-full bg-chipbg px-2 py-0.5 text-xs text-soft">
            {ROTULO_PAPEL[p.papel] ?? p.papel}
          </span>
        </div>
        <div className="flex shrink-0 gap-2">
          <BotaoPromptImagem tipo="personagem" id={p.id} permitirGerar />
          <button onClick={aoEditar} className={btnSecundario}>
            Editar
          </button>
          <button onClick={aoExcluir} className={btnPerigo}>
            Excluir
          </button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b border-line pb-1">
        <button type="button" onClick={() => setAba("perfil")} className={abaCls(aba === "perfil")}>
          Perfil
        </button>
        <button
          type="button"
          onClick={() => setAba("relacoes")}
          className={abaCls(aba === "relacoes")}
        >
          Relações
        </button>
      </div>

      {aba === "perfil" ? (
        <div className="space-y-4">
          {motivo && (
            <p className="rounded-md border border-line bg-surface p-2 text-xs text-muted">
              💡 {motivo}
            </p>
          )}
          <div className="flex flex-wrap items-start gap-4">
            <ImagemEntidade tipo="personagem" id={p.id} url={p.imagemUrl} rotulo="Personagem" />
            <div className="min-w-0 flex-1 space-y-3">
              {CAMPOS_PERFIL.some((c) => p[c.chave]) ? (
                CAMPOS_PERFIL.map((campo) => {
                  const valor = p[campo.chave];
                  if (!valor) return null;
                  return (
                    <div key={campo.chave}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {campo.rotulo}
                      </p>
                      <p className="mt-0.5 text-sm whitespace-pre-wrap">{valor}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted">
                  Sem descrição ainda. Clique em “Editar” para preencher o perfil.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <RelacoesPersonagem
          obraId={obraId}
          personagemId={p.id}
          personagemNome={p.nome}
          outros={outros}
        />
      )}
    </div>
  );
}