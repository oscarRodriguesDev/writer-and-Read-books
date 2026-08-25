"use client";

import Link from "next/link";
import Image from "next/image";
import { cardCls } from "@/components/ui";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const statusColors: Record<string, string> = {
  PLANEJAMENTO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  ESCRITA: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  REVISAO: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  CONCLUIDA: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

interface WorkCardProps {
  obra: Obra;
  onDelete?: () => void;
}

export function WorkCard({ obra, onDelete }: WorkCardProps) {
  const statusLabel = statusLabels[obra.status] || obra.status;
  const statusColor = statusColors[obra.status] || "bg-gray-100 text-gray-800";

  return (
    <div className={`${cardCls} relative group overflow-hidden rounded-xl bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-accent/40`}>
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      <Link href={`/obras/${obra.id}`} className="block" aria-label={`Abrir ${obra.titulo}`}>
        {obra.capaUrl && (
          <div className="mb-4 aspect-[3/4] w-full rounded-md overflow-hidden bg-chipbg">
            <Image
              src={obra.capaUrl}
              alt={`Capa de ${obra.titulo}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        )}

        <h2 className="mb-1 font-semibold line-clamp-1">{obra.titulo}</h2>

        {(obra.genero || obra.subgenero) && (
          <p className="mb-2 text-sm text-muted line-clamp-1">
            {obra.genero}
            {obra.subgenero && ` · ${obra.subgenero}`}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
            {statusLabel}
          </span>
          {obra.totalPalavras !== undefined && obra.totalPalavras > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {formatNumber(obra.totalPalavras)}
            </span>
          )}
        </div>

        <time className="text-xs text-faint" dateTime={typeof obra.atualizadoEm === "string" ? obra.atualizadoEm : obra.atualizadoEm.toISOString()}>
          Atualizado em {formatDate(obra.atualizadoEm)}
        </time>
      </Link>
    </div>
  );
}
