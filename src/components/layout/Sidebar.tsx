"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { GRAFIC } from "@/lib/grafic";

const NAV_ITEMS = [
  { href: "/", label: "Obras", icon: GRAFIC.iconeLivros },
  { href: "/obras/nova", label: "Nova Obra", icon: "➕" },
  { href: "/importar", label: "Importar", icon: "📥" },
];

const OBRA_NAV_ITEMS = [
  { href: "", label: "Visão geral", icon: "📋" },
  { href: "/esqueleto", label: "Esqueleto", icon: "🦴" },
  { href: "/personagens", label: "Personagens", icon: GRAFIC.iconePersonagens },
  { href: "/ambientes", label: "Ambientes", icon: GRAFIC.iconeAmbientes },
  { href: "/linha-do-tempo", label: "Linha do Tempo", icon: GRAFIC.iconeLinhaDoTempo },
  { href: "/capitulos", label: "Capítulos", icon: GRAFIC.iconeCapitulos },
  { href: "/analise", label: "Análise IA", icon: GRAFIC.iconeAnaliseIa },
  { href: "/ler", label: "Ler", icon: "👁️" },
];

export default function Sidebar({ obraId }: { obraId?: string }) {
  const { isCollapsed, isMobileOpen, toggleCollapsed, setMobileOpen } = useSidebar();
  const pathname = usePathname();

  const isInObra = !!obraId;
  const basePath = isInObra ? `/obras/${obraId}` : "";

  const navItems = isInObra
    ? OBRA_NAV_ITEMS.map((item) => ({
        ...item,
        href: `${basePath}${item.href}`,
        active: item.href === "" ? pathname === basePath : pathname.startsWith(`${basePath}${item.href}`),
      }))
    : NAV_ITEMS.map((item) => ({
        ...item,
        active: item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
      }));

  return (
    <>
      <button
        type="button"
        className={`fixed top-4 left-4 z-40 lg:hidden p-2 rounded-lg bg-surface border border-line shadow-md transition-transform ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-label="Fechar menu"
        aria-expanded={isMobileOpen}
      >
        ✕
      </button>

      <aside
        className={`fixed top-0 left-0 z-30 h-full bg-surface border-r border-line transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isCollapsed ? "w-16" : "w-64"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        role="navigation"
        aria-label="Navegação principal"
        data-state={isCollapsed ? "collapsed" : "expanded"}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <Link
              href="/"
              className="flex items-center gap-3 font-bold text-lg text-foreground transition-opacity"
              aria-label="Book Writer & Reader - Início"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={GRAFIC.mascoteEscritor}
                alt=""
                aria-hidden="true"
                className="h-8 w-8 rounded-full object-cover"
              />
              {!isCollapsed && <span className="whitespace-nowrap">Book Writer</span>}
            </Link>
            <button
              type="button"
              onClick={toggleCollapsed}
              className={`hidden lg:flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-hoverbg ${
                isCollapsed ? "rotate-180" : ""
              }`}
              aria-label={isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
              aria-expanded={!isCollapsed}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>

          {!isCollapsed && <p className="px-6 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-faint">Menu</p>}
          <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Navegação primária">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-accent text-onaccent"
                    : "text-muted hover:text-foreground hover:bg-hoverbg"
                }`}
                aria-current={item.active ? "page" : undefined}
              >
                {item.icon.startsWith("/") ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.icon}
                    alt=""
                    aria-hidden="true"
                    className="flex-shrink-0 h-5 w-5 object-contain"
                  />
                ) : (
                  <span className="flex-shrink-0 text-lg" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="border-t border-line p-3" aria-label="Ações rápidas">
            {isInObra && (
              <a
                href={`${basePath}/exportar/epub`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-hoverbg transition-colors"
                aria-label="Exportar obra (EPUB)"
              >
                <span className="flex-shrink-0 text-lg" aria-hidden="true">📤</span>
                {!isCollapsed && <span className="whitespace-nowrap">Exportar EPUB</span>}
              </a>
            )}
            {!isInObra && (
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-hoverbg transition-colors"
                aria-label="Ir para Obras"
              >
                <span className="flex-shrink-0 text-lg" aria-hidden="true">📚</span>
                {!isCollapsed && <span className="whitespace-nowrap">Obras</span>}
              </Link>
            )}
          </div>
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
    </>
  );
}