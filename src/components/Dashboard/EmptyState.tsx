"use client";

import Link from "next/link";
import { btnPrimario, btnSecundario } from "@/components/ui";

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.734-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Assistência de IA",
    description: "Gere cenas, revise textos e receba sugestões estruturais inteligentes.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: "Estrutura Narrativa",
    description: "Organize em 3 atos, capítulos e cenas com arrastar e soltar.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Leitura Imersiva",
    description: "Modo leitura sem distrações com controle de fonte e tema.",
  },
];

export function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4">
      <div className="mb-8 w-24 h-24 rounded-full bg-chipbg flex items-center justify-center mx-auto">
        <svg className="w-12 h-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 00-2-2V7m2 13V7m0 0l-4 4m4-4l4 4" />
        </svg>
      </div>

      <h2 className="mb-3 text-2xl font-bold">Comece sua primeira obra</h2>
      <p className="mb-8 max-w-md text-muted">
        Transforme suas ideias em histórias completas. Organize personagens,
        estruture enredos e escreva com o apoio de ferramentas inteligentes.
      </p>

      <div className="mb-12 w-full max-w-md flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/obras/nova" className={btnPrimario}>
          Criar primeira obra
        </Link>
        <Link href="/importar" className={btnSecundario}>
          Importar história
        </Link>
      </div>

      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {features.map((feature, index) => (
          <div key={index} className="flex gap-4 p-4 rounded-lg border border-line bg-surface">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-chipbg flex items-center justify-center text-muted">
              {feature.icon}
            </div>
            <div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}