"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import AlternadorTema from "@/components/AlternadorTema";

export default function TopBar({ obraId, obraTitulo }: { obraId?: string; obraTitulo?: string }) {
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();

  const isInObra = !!obraId;
  const basePath = isInObra ? `/obras/${obraId}` : "";

  const getBreadcrumbs = () => {
    const crumbs: Array<{ label: string; href?: string }> = [];

    if (isInObra) {
      crumbs.push({ label: "Obras", href: "/" });
      if (obraTitulo) {
        crumbs.push({ label: obraTitulo, href: basePath });
      }
      const relativePath = pathname.replace(basePath, "");
      if (relativePath && relativePath !== "/") {
        const segments = relativePath.split("/").filter(Boolean);
        const pathMap: Record<string, string> = {
          esqueleto: "Esqueleto",
          personagens: "Personagens",
          ambientes: "Ambientes",
          "linha-do-tempo": "Linha do Tempo",
          capitulos: "Capítulos",
          analise: "Análise IA",
          ler: "Ler",
        };
        segments.forEach((seg, i) => {
          const href = `${basePath}/${segments.slice(0, i + 1).join("/")}`;
          crumbs.push({ label: pathMap[seg] || seg, href });
        });
      }
    } else if (pathname !== "/") {
      const pathMap: Record<string, string> = {
        "obras/nova": "Nova Obra",
        importar: "Importar",
      };
      crumbs.push({ label: pathMap[pathname] || pathname, href: pathname });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-20 flex h-16 items-center gap-3 border-b border-line fundo-papel transition-all duration-300 ${
        isCollapsed ? "lg:pl-16" : "lg:pl-64"
      }`}
      role="banner"
    >
      <button
        type="button"
        className="lg:hidden p-2 rounded-lg hover:bg-hoverbg transition-colors"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={isMobileOpen}
        aria-controls="sidebar"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      <div className="hidden w-64 items-center gap-2 rounded-full bg-chipbg px-3 py-2 text-sm text-muted md:flex">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <span>Pesquisar no Book Writer</span>
      </div>

      <nav className="flex flex-1 items-center justify-center gap-1 overflow-x-auto px-2" aria-label="Navegação contextual">
        <ol className="flex items-center gap-1 whitespace-nowrap" role="list">
          {breadcrumbs.map((crumb, i) => (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-faint flex-shrink-0" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-sm text-muted hover:text-foreground transition-colors"
                  aria-current={i === breadcrumbs.length - 1 ? "page" : undefined}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-sm font-medium text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex items-center gap-2 pr-3">
        <div className="hidden sm:flex items-center gap-2">
          <AlternadorTema />
        </div>

        <div className="relative" role="region" aria-label="Menu do usuário">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-chipbg text-foreground hover:bg-hoverbg transition-colors"
            aria-label="Menu do usuário"
            aria-expanded="false"
            aria-haspopup="true"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
