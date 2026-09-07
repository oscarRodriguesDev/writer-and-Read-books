"use client";

import { useState, useMemo } from "react";
import { WorkCard } from "./WorkCard";
import { SkeletonCard } from "./SkeletonCard";
import { EstadoVazio } from "@/components/EstadoVazio";
import { GRAFIC } from "@/lib/grafic";
import { Obra } from "@/lib/types";
import { excluirObra } from "@/app/actions/obras";
import { toast } from "sonner";

type SortOption = "recente" | "alfabetica" | "palavras" | "status";
type FilterOption = "todas" | "ativas" | "arquivadas";

interface WorkGridProps {
  obras: Obra[];
  isLoading?: boolean;
  initialSort?: SortOption;
  initialFilter?: FilterOption;
  autor?: string | null;
}

const sortLabels: Record<SortOption, string> = {
  recente: "Mais recentes",
  alfabetica: "A-Z",
  palavras: "Palavras",
  status: "Status",
};

const filterLabels: Record<FilterOption, string> = {
  todas: "Todas",
  ativas: "Ativas",
  arquivadas: "Arquivadas",
};

async function handleDelete(obraId: string, obraTitulo: string) {
  if (!confirm(`Tem certeza que deseja excluir "${obraTitulo}"?`)) return;
  
  try {
    await excluirObra(obraId);
    toast.success("Obra excluída");
    window.location.reload();
  } catch {
    toast.error("Erro ao excluir obra");
  }
}

export function WorkGrid({
  obras,
  isLoading = false,
  initialSort = "recente",
  initialFilter = "todas",
  autor,
}: WorkGridProps) {
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [filter, setFilter] = useState<FilterOption>(initialFilter);
  const [busca, setBusca] = useState("");

  const filteredObras = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase();
    let result = buscaNormalizada
      ? obras.filter(
          (o) =>
            o.titulo.toLowerCase().includes(buscaNormalizada) ||
            (o.genero ?? "").toLowerCase().includes(buscaNormalizada) ||
            (o.subgenero ?? "").toLowerCase().includes(buscaNormalizada),
        )
      : obras;

    if (filter === "ativas") {
      result = result.filter((o) => !o.arquivada);
    } else if (filter === "arquivadas") {
      result = result.filter((o) => o.arquivada);
    }

    switch (sort) {
      case "recente":
        result = [...result].sort((a, b) =>
          new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime()
        );
        break;
      case "alfabetica":
        result = [...result].sort((a, b) => a.titulo.localeCompare(b.titulo));
        break;
      case "palavras":
        result = [...result].sort((a, b) => (b.totalPalavras || 0) - (a.totalPalavras || 0));
        break;
      case "status":
        const statusOrder: Record<string, number> = {
          ESCRITA: 0,
          REVISAO: 1,
          PLANEJAMENTO: 2,
          CONCLUIDA: 3,
        };
        result = [...result].sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
        break;
    }

    return result;
  }, [obras, sort, filter, busca]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (filteredObras.length === 0) {
    return (
      <EstadoVazio
        src={GRAFIC.vazioDashboard}
        alt="Nenhuma obra encontrada"
        mensagem={
          busca.trim()
            ? `Nenhuma obra encontrada para "${busca.trim()}".`
            : "Nenhuma obra encontrada com os filtros atuais."
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm">
        {/* Busca por obras */}
        <div className="relative min-w-44 flex-1 sm:max-w-64">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m20 20-4-4" />
          </svg>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar obra…"
            aria-label="Buscar obra"
            className="w-full rounded-md border border-inputline bg-surface py-1.5 pl-9 pr-8 text-sm text-foreground placeholder:text-faint focus:border-foreground focus:outline-none"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-faint transition-colors hover:text-foreground hover:bg-hoverbg"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="filter-obras" className="text-sm text-muted">
            Filtrar:
          </label>
          <select
            id="filter-obras"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterOption)}
            className="rounded-md border border-inputline bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-foreground"
          >
            {Object.entries(filterLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <label htmlFor="sort-obras" className="text-sm text-muted">
            Ordenar:
          </label>
          <select
            id="sort-obras"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-md border border-inputline bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-foreground"
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredObras.map((obra) => (
          <WorkCard 
            key={obra.id} 
            obra={obra} 
            autor={autor}
            onDelete={() => handleDelete(obra.id, obra.titulo)} 
          />
        ))}
      </div>

      {filter === "arquivadas" && filteredObras.length > 0 && (
        <p className="mt-4 text-sm text-muted text-center">
          {filteredObras.length} obra(s) arquivada(s). Use o filtro &ldquo;Ativas&rdquo; para ver suas obras em andamento.
        </p>
      )}
    </div>
  );
}
