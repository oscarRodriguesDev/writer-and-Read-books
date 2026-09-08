"use client";

import { useEffect, useState, useCallback } from "react";
import { FeedCard, type FeedItem } from "./FeedCard";
import { GENEROS_LITERARIOS } from "@/lib/constants";
import { EstadoVazio } from "@/components/EstadoVazio";
import { GRAFIC } from "@/lib/grafic";

type RespostaFeed = {
  itens: FeedItem[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
};

/**
 * Explorador do feed: busca, filtro por gênero, ordenação e paginação.
 * Consome GET /api/feed (server-side) — aqui apenas reapresentamos os dados.
 */
export function FeedExplorar({
  dadosIniciais,
  usuarioId,
}: {
  dadosIniciais: RespostaFeed;
  usuarioId: string | null;
}) {
  const [dados, setDados] = useState<RespostaFeed>(dadosIniciais);
  const [busca, setBusca] = useState("");
  const [genero, setGenero] = useState("");
  const [ordem, setOrdem] = useState("recentes");
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(
    async (paginaAlvo: number) => {
      setCarregando(true);
      const params = new URLSearchParams({ pagina: String(paginaAlvo), limite: "12" });
      if (busca.trim()) params.set("q", busca.trim());
      if (genero) params.set("genero", genero);
      if (ordem) params.set("ordem", ordem);
      try {
        const res = await fetch(`/api/feed?${params.toString()}`);
        if (res.ok) {
          const json = (await res.json()) as RespostaFeed;
          setDados(json);
          setPagina(json.pagina);
        }
      } finally {
        setCarregando(false);
      }
    },
    [busca, genero, ordem],
  );

  // Recarrega apenas quando busca/gênero/ordem mudam (não a cada digitação)
  useEffect(() => {
    const t = setTimeout(() => carregar(1), 400);
    return () => clearTimeout(t);
  }, [busca, genero, ordem, carregar]);

  const logado = !!usuarioId;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm">
        <div className="relative min-w-44 flex-1 sm:max-w-72">
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar obra ou autor…"
            aria-label="Buscar no feed"
            className="w-full rounded-md border border-inputline bg-surface py-1.5 pl-3 pr-8 text-sm text-foreground placeholder:text-faint focus:border-foreground focus:outline-none"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-faint transition-colors hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={genero}
          onChange={(e) => setGenero(e.target.value)}
          aria-label="Filtrar por gênero"
          className="rounded-md border border-inputline bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-foreground"
        >
          <option value="">Todos os gêneros</option>
          {GENEROS_LITERARIOS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="ordem-feed" className="text-sm text-muted">
            Ordenar:
          </label>
          <select
            id="ordem-feed"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value)}
            className="rounded-md border border-inputline bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-foreground"
          >
            <option value="recentes">Mais recentes</option>
            <option value="curtidas">Mais curtidas</option>
          </select>
        </div>
      </div>

      {carregando ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-line bg-surface" />
          ))}
        </div>
      ) : dados.itens.length === 0 ? (
        <EstadoVazio
          src={GRAFIC.vazioDashboard}
          alt="Nenhuma obra compartilhada"
          mensagem={
            busca || genero
              ? "Nenhuma obra encontrada com os filtros atuais."
              : "Nenhuma obra compartilhada ainda. Os autores podem compartilhar suas obras nesta comunidade."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {dados.itens.map((item) => (
            <FeedCard key={item.id} item={item} logado={logado} />
          ))}
        </div>
      )}

      {dados.totalPaginas > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={pagina <= 1 || carregando}
            onClick={() => carregar(pagina - 1)}
            className="rounded-lg border border-inputline bg-surface px-3 py-2 text-sm text-foreground hover:bg-hoverbg disabled:opacity-50"
          >
            ← Anterior
          </button>
          <span className="px-3 text-sm text-muted">
            Página {pagina} de {dados.totalPaginas}
          </span>
          <button
            type="button"
            disabled={pagina >= dados.totalPaginas || carregando}
            onClick={() => carregar(pagina + 1)}
            className="rounded-lg border border-inputline bg-surface px-3 py-2 text-sm text-foreground hover:bg-hoverbg disabled:opacity-50"
          >
            Próxima →
          </button>
        </nav>
      )}
    </div>
  );
}
