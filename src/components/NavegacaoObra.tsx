"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "", rotulo: "Visão geral" },
  { href: "/esqueleto", rotulo: "Esqueleto" },
  { href: "/atos", rotulo: "Atos" },
  { href: "/personagens", rotulo: "Personagens" },
  { href: "/ambientes", rotulo: "Ambientes" },
  { href: "/artefatos", rotulo: "Artefatos" },
  { href: "/regras", rotulo: "Regras" },
  { href: "/linha-do-tempo", rotulo: "Linha do Tempo" },
  { href: "/capitulos", rotulo: "Capítulos" },
  { href: "/analise", rotulo: "Análise IA" },
];

export function NavegacaoObra({ obraId }: { obraId: string }) {
  const pathname = usePathname();
  const base = `/obras/${obraId}`;

  return (
    <nav
      className="flex flex-wrap items-center gap-1 rounded-xl border border-line fundo-papel p-1.5 shadow-sm"
      aria-label="Navegação da obra"
    >
      {ABAS.map((aba) => {
        const href = `${base}${aba.href}`;
        const ativa =
          aba.href === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={aba.rotulo}
            href={href}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              ativa
                ? "bg-accent font-semibold text-onaccent"
                : "text-muted hover:bg-hoverbg hover:text-foreground"
            }`}
            aria-current={ativa ? "page" : undefined}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
