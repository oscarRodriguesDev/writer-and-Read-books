"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import type { UsuarioAtual } from "@/lib/usuario-atual";

export default function AppLayoutWrapper({
  children,
  usuarioAtual,
}: {
  children: React.ReactNode;
  usuarioAtual?: UsuarioAtual | null;
}) {
  const pathname = usePathname();
  const [obraId, setObraId] = useState<string | undefined>();
  const [obraTitulo, setObraTitulo] = useState<string | undefined>();

  useEffect(() => {
    const match = pathname.match(/^\/obras\/([^/]+)/);
    if (match) {
      setObraId(match[1]);
    } else {
      setObraId(undefined);
      setObraTitulo(undefined);
    }
  }, [pathname]);

  // Páginas de autenticação não exibem o layout da aplicação (sidebar/topbar).
  // O leitor público do feed (/feed/[obraId]) também é uma experiência
  // isolada: diferente do leitor do escritor, SEM sidebar e SEM header.
  // A listagem do feed (/) para visitantes deslogados segue a mesma métrica
  // de leitura: sem sidebar/header, com as laterais de sugestões.
  const feedAnonimo = pathname === "/feed" && !usuarioAtual;
  if (
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname.startsWith("/feed/") ||
    feedAnonimo
  ) {
    return <>{children}</>;
  }

  return <Layout obraId={obraId} obraTitulo={obraTitulo} usuarioAtual={usuarioAtual}>{children}</Layout>;
}