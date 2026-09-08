"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSidebar } from "./SidebarContext";
import AlternadorTema from "@/components/AlternadorTema";
import type { UsuarioAtual } from "@/lib/usuario-atual";

export default function TopBar({
  obraId,
  obraTitulo,
  usuarioAtual,
}: {
  obraId?: string;
  obraTitulo?: string;
  usuarioAtual?: UsuarioAtual | null;
}) {
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu do usuário ao clicar fora ou pressionar Escape
  useEffect(() => {
    if (!menuUsuarioAberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuUsuarioAberto(false);
      }
    }
    function aoPressionarEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuUsuarioAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoPressionarEscape);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoPressionarEscape);
    };
  }, [menuUsuarioAberto]);

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
        perfil: "Perfil",
        feed: "Feed",
      };
      if (pathMap[pathname]) {
        crumbs.push({ label: pathMap[pathname], href: pathname });
      } else if (pathname.startsWith("/ler/")) {
        // O id da obra fica só na URL; no breadcrumb aparece apenas "Ler"
        crumbs.push({ label: "Ler" });
      } else if (pathname.startsWith("/feed/")) {
        // Obra pública do feed: "Feed / Título" (o id fica só na URL)
        crumbs.push({ label: "Feed", href: "/feed" });
        crumbs.push({ label: "Obra" });
      } else {
        crumbs.push({ label: pathname, href: pathname });
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const inicial = (usuarioAtual?.nome || "?").trim().charAt(0).toUpperCase() || "?";
  const rotuloUsuario = usuarioAtual?.username ? `@${usuarioAtual.username}` : usuarioAtual?.nome;

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

        <div className="relative" role="region" aria-label="Menu do usuário" ref={menuRef}>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface pr-3 text-foreground transition-colors hover:border-accent hover:bg-hoverbg"
            aria-label="Menu do usuário"
            aria-expanded={menuUsuarioAberto}
            aria-haspopup="true"
            onClick={() => setMenuUsuarioAberto((a) => !a)}
          >
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-chipbg text-sm font-bold text-accent">
              {usuarioAtual?.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={usuarioAtual.fotoUrl} alt="Foto do usuário" className="h-full w-full object-cover" />
              ) : usuarioAtual ? (
                inicial
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </span>
            {rotuloUsuario && (
              <span className="hidden max-w-32 truncate text-sm font-medium lg:block">{rotuloUsuario}</span>
            )}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hidden text-faint lg:block" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {menuUsuarioAberto && (
            <div
              role="menu"
              aria-label="Opções do usuário"
              className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-xl border border-line fundo-papel shadow-lg"
            >
              {usuarioAtual ? (
                <>
                  <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-chipbg text-sm font-bold text-accent">
                      {usuarioAtual.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={usuarioAtual.fotoUrl} alt="Foto do usuário" className="h-full w-full object-cover" />
                      ) : (
                        inicial
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">{usuarioAtual.nome}</span>
                      <span className="block truncate text-xs text-muted">
                        {usuarioAtual.username ? `@${usuarioAtual.username}` : ""}
                      </span>
                    </span>
                  </div>
                  <Link
                    href="/perfil"
                    role="menuitem"
                    onClick={() => setMenuUsuarioAberto(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-foreground transition-colors hover:bg-hoverbg"
                  >
                    👤 Meu perfil
                  </Link>
                  <div role="separator" className="border-t border-line" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuUsuarioAberto(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-danger transition-colors hover:bg-hoverbg"
                  >
                    🚪 Sair
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  role="menuitem"
                  onClick={() => setMenuUsuarioAberto(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-hoverbg"
                >
                  🔑 Entrar / Cadastrar
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
