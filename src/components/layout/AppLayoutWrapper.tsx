"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
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

  return <Layout obraId={obraId} obraTitulo={obraTitulo}>{children}</Layout>;
}