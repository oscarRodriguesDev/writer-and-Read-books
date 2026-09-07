"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimario } from "@/components/ui";
import { CapaLivro } from "@/components/CapaLivro";

interface FormObraProps {
  /** Autor exibido na capa default (nome artístico ou real do usuário). */
  autor?: string | null;
}

export function FormObra({ autor }: FormObraProps) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [genero, setGenero] = useState("");
  const [capaUrl, setCapaUrl] = useState("");

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
          titulo: titulo.trim(),
          genero: genero.trim() || null,
          tema: String(form.get("tema") ?? "").trim() || null,
          descricao: String(form.get("descricao") ?? "").trim() || null,
          capaUrl: capaUrl.trim() || null,
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
    <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start">
      {/* Prévia da capa */}
      <div className="flex flex-col items-center gap-3 md:w-52">
        <CapaLivro
          titulo={titulo}
          genero={genero}
          autor={autor}
          capaUrl={capaUrl}
          className="w-44 md:w-full"
        />
        <p className="max-w-44 text-center text-xs leading-5 text-soft md:max-w-full">
          {capaUrl
            ? "Capa definida por você. A capa default aparece enquanto não houver imagem."
            : "Capa default gerada em CSS — muda ao digitar o título/gênero ou definir uma imagem."}
        </p>
      </div>

      <form onSubmit={aoEnviar} className="space-y-4">
        <div>
          <label htmlFor="titulo" className={labelCls}>
            Título *
          </label>
          <input
            id="titulo"
            name="titulo"
            required
            maxLength={200}
            className={inputCls}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="genero" className={labelCls}>Gênero</label>
          <input
            id="genero"
            name="genero"
            maxLength={100}
            className={inputCls}
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="tema" className={labelCls}>Tema</label>
          <input id="tema" name="tema" maxLength={200} className={inputCls} />
        </div>
        <div>
          <label htmlFor="descricao" className={labelCls}>Descrição</label>
          <textarea id="descricao" name="descricao" rows={4} maxLength={2000} className={inputCls} />
        </div>
        <div>
          <label htmlFor="capaUrl" className={labelCls}>Capa (URL)</label>
          <input
            id="capaUrl"
            name="capaUrl"
            maxLength={500}
            className={inputCls}
            placeholder="https://... ou /uploads/capa/arquivo.jpg"
            value={capaUrl}
            onChange={(e) => setCapaUrl(e.target.value)}
          />
        </div>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button type="submit" disabled={enviando} className={btnPrimario}>
          {enviando ? "Criando…" : "Criar obra"}
        </button>
      </form>
    </div>
  );
}