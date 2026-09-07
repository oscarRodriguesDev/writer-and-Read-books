"use client";

import Link from "next/link";
import { cardCls } from "@/components/ui";
import { CapaLivro } from "@/components/CapaLivro";

interface Obra {
  id: string;
  titulo: string;
  genero?: string | null;
  subgenero?: string | null;
  status: string;
  arquivada: boolean;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
  capaUrl?: string | null;
  totalPalavras?: number;
}

const statusLabels: Record<string, string> = {
  PLANEJAMENTO: "Planejamento",
  ESCRITA: "Escrita",
  REVISAO: "Revisão",
  CONCLUIDA: "Concluída",
};

interface WorkCardProps {
  obra: Obra;
  autor?: string | null;
  onDelete?: () => void;
}

export function WorkCard({ obra, autor, onDelete }: WorkCardProps) {
  const statusLabel = statusLabels[obra.status] || obra.status;

  return (
    <div className={`${cardCls} relative group overflow-hidden rounded-lg fundo-papel shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-accent/40`}>
      {onDelete && (
        <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-full bg-surface/90 backdrop-blur-sm p-1.5 text-muted hover:text-foreground hover:bg-hoverbg transition-colors"
            aria-label="Excluir obra"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      <Link href={`/obras/${obra.id}`} className="block transition-transform duration-300 group-hover:scale-[1.02]" aria-label={`Abrir ${obra.titulo}`}>
        <CapaLivro
          titulo={obra.titulo}
          genero={obra.genero ?? undefined}
          autor={autor}
          capaUrl={obra.capaUrl}
          className="w-full"
          compacto
          statusLabel={statusLabel}
          totalPalavras={obra.totalPalavras}
        />
      </Link>
    </div>
  );
}