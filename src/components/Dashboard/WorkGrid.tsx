"use client";

import { useState, useMemo } from "react";
import { WorkCard } from "./WorkCard";
import { SkeletonCard } from "./SkeletonCard";
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
}: WorkGridProps) {
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [filter, setFilter] = useState<FilterOption>(initialFilter);

  const filteredObras = useMemo(() => {
    let result = obras;

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
  }, [obras, sort, filter]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (filteredObras.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <svg className="mx-auto mb-3 w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>Nenhuma obra encontrada com os filtros atuais.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredObras.map((obra) => (
          <WorkCard 
            key={obra.id} 
            obra={obra} 
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