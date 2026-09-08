"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CapaLivro } from "@/components/CapaLivro";

export type FeedItem = {
  id: string;
  titulo: string;
  genero: string | null;
  subgenero: string | null;
  descricao: string | null;
  status: string;
  capaUrl: string | null;
  atualizadoEm: string;
  autor: string | null;
  curtidas: number;
  comentarios: number;
  curtidaDoUsuario: boolean;
};

/**
 * Card de uma obra no feed: capa, título, autor, curtidas/comentários e um
 * botão de curtir rápido. Clique leva ao leitor público da obra.
 */
export function FeedCard({
  item,
  logado,
}: {
  item: FeedItem;
  logado: boolean;
}) {
  const router = useRouter();
  const [curtida, setCurtida] = useState(item.curtidaDoUsuario);
  const [totalCurtidas, setTotalCurtidas] = useState(item.curtidas);
  const [carregando, setCarregando] = useState(false);

  async function curtir(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!logado) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/feed/${item.id}`)}`);
      return;
    }
    setCarregando(true);
    const otimista = !curtida;
    setCurtida(otimista);
    setTotalCurtidas((t) => t + (otimista ? 1 : -1));
    try {
      const res = await fetch(`/api/feed/${item.id}/curtir`, { method: "POST" });
      if (!res.ok) {
        setCurtida(!otimista);
        setTotalCurtidas((t) => Math.max(0, t - (otimista ? 1 : -1)));
      }
    } catch {
      setCurtida(!otimista);
      setTotalCurtidas((t) => Math.max(0, t - (otimista ? 1 : -1)));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Link
      href={`/feed/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line fundo-papel shadow-sm transition-all duration-normal hover:shadow-lg hover:border-accent/40"
    >
      <div className="flex justify-center p-4 pb-2">
        <CapaLivro
          titulo={item.titulo}
          autor={item.autor}
          genero={item.genero ?? undefined}
          capaUrl={item.capaUrl}
          className="w-36"
          compacto
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 pt-1">
        <h3 className="line-clamp-1 font-semibold leading-tight text-foreground">
          {item.titulo}
        </h3>
        <p className="text-xs text-muted">
          {item.autor ? `por ${item.autor}` : "Autor desconhecido"}
        </p>
        {item.descricao && (
          <p className="line-clamp-2 mt-1 text-xs text-soft">{item.descricao}</p>
        )}
        <div className="mt-auto flex items-center gap-4 pt-3 text-xs text-muted">
          <button
            type="button"
            onClick={curtir}
            disabled={carregando}
            aria-pressed={curtida}
            aria-label={curtida ? "Descurtir" : "Curtir"}
            className={`inline-flex items-center gap-1 transition-colors ${
              curtida ? "text-accent" : "hover:text-accent"
            } disabled:opacity-50`}
          >
            <span aria-hidden="true">{curtida ? "❤️" : "🤍"}</span>
            {totalCurtidas.toLocaleString("pt-BR")}
          </button>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true">💬</span>
            {item.comentarios.toLocaleString("pt-BR")}
          </span>
        </div>
      </div>
    </Link>
  );
}
