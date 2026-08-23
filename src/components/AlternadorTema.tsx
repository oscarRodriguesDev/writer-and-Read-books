"use client";

import { useEffect, useState } from "react";

export default function AlternadorTema() {
  const [tema, setTema] = useState<"claro" | "escuro" | null>(null);

  useEffect(() => {
    setTema(document.documentElement.classList.contains("dark") ? "escuro" : "claro");
  }, []);

  function alternar() {
    const novo = tema === "escuro" ? "claro" : "escuro";
    setTema(novo);
    document.documentElement.classList.toggle("dark", novo === "escuro");
    try {
      localStorage.setItem("tema", novo);
    } catch {
      // localStorage indisponível: tema não persiste, mas funciona na sessão
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={tema === "escuro" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title="Alternar tema"
      className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-soft hover:bg-hoverbg"
    >
      {tema === "escuro" ? "Claro" : "Escuro"}
    </button>
  );
}
