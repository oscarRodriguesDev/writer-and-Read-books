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

  // Páginas de autenticação não exibem o layout da aplicação (sidebar/topbar)
  if (pathname === "/login" || pathname === "/cadastro") {
    return <>{children}</>;
  }

  return <Layout obraId={obraId} obraTitulo={obraTitulo} usuarioAtual={usuarioAtual}>{children}</Layout>;
}