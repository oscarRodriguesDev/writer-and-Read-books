import Link from "next/link";
import { ReactNode } from "react";
import { NavegacaoObra } from "./NavegacaoObra";

interface CabecalhoObraProps {
  obraId: string;
  titulo: string;
  subtitulo: string;
  acoes?: ReactNode;
}

/**
 * Cabeçalho padrão das páginas de uma obra:
 * botão "← Obras" + card de papel com título/subtítulo (e ações opcionais)
 * + menu de navegação da obra.
 */
export function CabecalhoObra({ obraId, titulo, subtitulo, acoes }: CabecalhoObraProps) {
  return (
    <div className="mb-6 space-y-4">
      <Link
        href="/"
        className="inline-block rounded-lg border border-line fundo-papel px-3 py-1.5 text-sm text-foreground shadow-sm transition-colors hover:bg-hoverbg"
      >
        ← Obras
      </Link>
      <header className="flex flex-col gap-4 rounded-xl border border-line fundo-papel p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <p className="text-sm text-muted">{subtitulo}</p>
        </div>
        {acoes}
      </header>
      <NavegacaoObra obraId={obraId} />
    </div>
  );
}