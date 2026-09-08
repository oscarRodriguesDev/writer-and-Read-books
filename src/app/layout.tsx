import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayoutWrapper from "@/components/layout/AppLayoutWrapper";
import TemaInit from "@/components/TemaInit";
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const usuarioAtual = await buscarUsuarioAtual();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <AppLayoutWrapper usuarioAtual={usuarioAtual}>{children}</AppLayoutWrapper>
        {/* Script do tema injetado via useServerInsertedHTML (SSR, sem warning
            do React 19.2 — ver TemaInit.tsx) */}
        <TemaInit />
      </body>
    </html>
  );
}
