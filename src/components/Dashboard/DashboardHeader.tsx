"use client";

import Link from "next/link";
import { btnPrimario, btnSecundario } from "@/components/ui";

interface DashboardHeaderProps {
  totalObras: number;
  totalPalavras: number;
  obrasAtivas: number;
  obrasArquivadas: number;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

export function DashboardHeader({
  totalObras,
  totalPalavras,
  obrasAtivas,
}: DashboardHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Seu espaço de criação</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Minhas Obras</h1>
        <p className="mt-2 text-sm leading-6 text-soft">
          {totalObras === 0
            ? "Nenhuma obra cadastrada ainda."
            : `${obrasAtivas} em andamento • ${totalPalavras === 0 ? "0" : formatNumber(totalPalavras)} palavras no total`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/importar" className={btnSecundario}>
          <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Importar
        </Link>
        <Link href="/obras/nova" className={btnPrimario}>
          <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Obra
        </Link>
      </div>
    </header>
  );
}
