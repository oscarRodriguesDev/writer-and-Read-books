"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "", rotulo: "Visão geral" },
  { href: "/esqueleto", rotulo: "Esqueleto" },
  { href: "/personagens", rotulo: "Personagens" },
  { href: "/ambientes", rotulo: "Ambientes" },
  { href: "/regras", rotulo: "Regras" },
  { href: "/linha-do-tempo", rotulo: "Linha do Tempo" },
  { href: "/capitulos", rotulo: "Capítulos" },
  { href: "/analise", rotulo: "Análise IA" },
];

export function NavegacaoObra({ obraId }: { obraId: string }) {
  const pathname = usePathname();
  const base = `/obras/${obraId}`;

  return (
    <nav className="flex flex-wrap gap-1 border-b border-line">
      {ABAS.map((aba) => {
        const href = `${base}${aba.href}`;
        const ativa =
          aba.href === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-t-md px-3 py-2 text-sm ${
              ativa
                ? "border-b-2 border-foreground font-semibold text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
