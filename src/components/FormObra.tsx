"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimario } from "@/components/ui";

export function FormObra() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/obras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.get("titulo"),
          genero: form.get("genero"),
          tema: form.get("tema"),
          descricao: form.get("descricao"),
        }),
      });
      const dados = await res.json();
      if (!res.ok) {
        setErro(dados.erro ?? "Não foi possível criar a obra.");
        return;
      }
      router.push(`/obras/${dados.id}`);
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-4">
      <div>
        <label htmlFor="titulo" className={labelCls}>
          Título *
        </label>
        <input id="titulo" name="titulo" required maxLength={200} className={inputCls} />
      </div>
      <div>
        <label htmlFor="genero" className={labelCls}>Gênero</label>
        <input id="genero" name="genero" maxLength={100} className={inputCls} />
      </div>
      <div>
        <label htmlFor="tema" className={labelCls}>Tema</label>
        <input id="tema" name="tema" maxLength={200} className={inputCls} />
      </div>
      <div>
        <label htmlFor="descricao" className={labelCls}>Descrição</label>
        <textarea id="descricao" name="descricao" rows={4} maxLength={2000} className={inputCls} />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <button type="submit" disabled={enviando} className={btnPrimario}>
        {enviando ? "Criando…" : "Criar obra"}
      </button>
    </form>
  );
}
