"use client";

import { useServerInsertedHTML } from "next/navigation";

const scriptTema = `(function(){try{var t=localStorage.getItem("tema");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"escuro":"claro";}document.documentElement.classList.toggle("dark",t==="escuro");}catch(e){}})();`;

/**
 * Injeta o script de tema no HTML via `useServerInsertedHTML`.
 *
 * POR QUE NÃO USAR <Script>/<script> na árvore do layout:
 * o React 19.2+ emite "Encountered a script tag while rendering React
 * component" para QUALQUER <script> renderizado na árvore hidratada
 * (inclusive next/script com beforeInteractive). Este hook injeta o markup
 * direto no stream de SSR e NÃO o renderiza no client — o script continua
 * executando antes da hidratação (sem FOUC de tema) e sem o warning.
 */
export default function TemaInit() {
  useServerInsertedHTML(() => (
    // eslint-disable-next-line @next/next/no-sync-scripts
    <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
  ));
  return null;
}