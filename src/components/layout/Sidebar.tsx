"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";

const NAV_ITEMS = [
  { href: "/", label: "Obras", icon: "📚" },
  { href: "/obras/nova", label: "Nova Obra", icon: "➕" },
  { href: "/importar", label: "Importar", icon: "📥" },
];

const OBRA_NAV_ITEMS = [
  { href: "", label: "Visão geral", icon: "📋" },
  { href: "/esqueleto", label: "Esqueleto", icon: "🦴" },
  { href: "/personagens", label: "Personagens", icon: "👥" },
  { href: "/ambientes", label: "Ambientes", icon: "🏙️" },
  { href: "/linha-do-tempo", label: "Linha do Tempo", icon: "📅" },
  { href: "/capitulos", label: "Capítulos", icon: "📖" },
  { href: "/analise", label: "Análise IA", icon: "🤖" },
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

  if (typeof window === "undefined") return null;

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
          <div className="flex h-16 items-center justify-between px-4 border-b border-line">
            <Link
              href="/"
              className="flex items-center gap-3 font-bold text-lg text-foreground transition-opacity"
              aria-label="Book Writer & Reader - Início"
            >
              <span className="text-2xl">📖</span>
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

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Navegação primária">
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
                <span className="flex-shrink-0 text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {isInObra && !isCollapsed && (
            <div className="border-t border-line pt-4 px-3" aria-label="Contexto da obra">
              <p className="mb-2 px-3 text-xs font-semibold text-faint uppercase tracking-wider">
                Obra Atual
              </p>
              <nav className="space-y-1" aria-label="Navegação da obra">
                {OBRA_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={`${basePath}${item.href}`}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      item.href === ""
                        ? pathname === basePath
                          ? "bg-accent text-onaccent"
                          : "text-muted hover:text-foreground hover:bg-hoverbg"
                        : pathname.startsWith(`${basePath}${item.href}`)
                        ? "bg-accent text-onaccent"
                        : "text-muted hover:text-foreground hover:bg-hoverbg"
                    }`}
                    aria-current={
                      item.href === "" ? (pathname === basePath ? "page" : undefined) : pathname.startsWith(`${basePath}${item.href}`) ? "page" : undefined
                    }
                  >
                    <span className="text-lg" aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}

          <div className="border-t border-line p-3" aria-label="Conta e configurações">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-hoverbg transition-colors">
              <span className="flex-shrink-0 text-lg" aria-hidden="true">🌙</span>
              {!isCollapsed && <span className="whitespace-nowrap">Tema</span>}
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-hoverbg transition-colors">
              <span className="flex-shrink-0 text-lg" aria-hidden="true">⚙️</span>
              {!isCollapsed && <span className="whitespace-nowrap">Configurações</span>}
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-hoverbg transition-colors">
              <span className="flex-shrink-0 text-lg" aria-hidden="true">👤</span>
              {!isCollapsed && <span className="whitespace-nowrap">Minha conta</span>}
            </div>
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