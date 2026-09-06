"use client";

import { useEffect, useState } from "react";
import { GRAFIC } from "@/lib/grafic";

type Tema = "claro" | "escuro";

export default function AlternadorTema() {
  const [tema, setTema] = useState<Tema>("claro");

  useEffect(() => {
    setTema(document.documentElement.classList.contains("dark") ? "escuro" : "claro");
  }, []);

  function escolher(novo: Tema) {
    setTema(novo);
    document.documentElement.classList.toggle("dark", novo === "escuro");
    try {
      localStorage.setItem("tema", novo);
    } catch {
      // localStorage indisponível: tema não persiste, mas funciona na sessão
    }
  }

  const base =
    "px-2.5 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md";
  const ativo = "bg-accent text-onaccent";
  const inativo = "bg-surface text-soft hover:bg-hoverbg border border-line";

  return (
    <div
      role="radiogroup"
      aria-label="Escolher tema"
      className="flex items-center gap-1.5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={GRAFIC.iconeTema}
        alt=""
        aria-hidden="true"
        className="h-5 w-5 object-contain"
      />
      <div className="flex overflow-hidden rounded-md shadow-sm">
        <button
          type="button"
          role="radio"
          aria-checked={tema === "claro"}
          onClick={() => escolher("claro")}
          className={`${base} ${tema === "claro" ? ativo : inativo}`}
        >
          Claro
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={tema === "escuro"}
          onClick={() => escolher("escuro")}
          className={`${base} ${tema === "escuro" ? ativo : inativo}`}
        >
          Escuro
        </button>
      </div>
    </div>
  );
}
