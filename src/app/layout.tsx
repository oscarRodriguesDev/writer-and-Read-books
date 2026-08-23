import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AlternadorTema from "@/components/AlternadorTema";
import "./globals.css";

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

// Aplica o tema salvo (ou o do sistema) antes da primeira pintura, evitando flash
const scriptTema = `(function(){try{var t=localStorage.getItem("tema");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"escuro":"claro";}document.documentElement.classList.toggle("dark",t==="escuro");}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <div className="fixed bottom-4 right-4 z-50">
          <AlternadorTema />
        </div>
      </body>
    </html>
  );
}
