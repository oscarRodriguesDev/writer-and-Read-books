import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayoutWrapper from "@/components/layout/AppLayoutWrapper";
import { buscarUsuarioAtual } from "@/lib/usuario-atual";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Book Writer & Reader",
  description: "Escreva, estruture e leia suas obras narrativas",
};

const scriptTema = `(function(){try{var t=localStorage.getItem("tema");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"escuro":"claro";}document.documentElement.classList.toggle("dark",t==="escuro");}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const usuarioAtual = await buscarUsuarioAtual();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* beforeInteractive: executa antes da hidratação (evita FOUC de tema)
            e não gera o aviso do React de script não executado no client */}
        <Script
          id="script-tema"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: scriptTema }}
        />
      </head>
      <body className="min-h-full">
        <AppLayoutWrapper usuarioAtual={usuarioAtual}>{children}</AppLayoutWrapper>
      </body>
    </html>
  );
}
