import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NavegacaoObra } from "@/components/NavegacaoObra";
import {
  GerenciadorLinhaDoTempo,
  type EventoDados,
} from "@/components/GerenciadorLinhaDoTempo";

export const dynamic = "force-dynamic";

export default async function LinhaDoTempoPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: {
      eventos: {
        orderBy: { ordemCronologica: "asc" },
        include: { capitulo: { select: { titulo: true } } },
      },
      capitulos: { select: { id: true, titulo: true }, orderBy: { ordemEscrita: "asc" } },
    },
  });
  if (!obra) notFound();

  const eventos: EventoDados[] = obra.eventos.map((ev) => ({
    id: ev.id,
    titulo: ev.titulo,
    descricao: ev.descricao,
    escalaTemporal: ev.escalaTemporal,
    dataInicio: ev.dataInicio,
    dataFim: ev.dataFim,
    ordemCronologica: ev.ordemCronologica,
    capituloId: ev.capituloId,
    capituloTitulo: ev.capitulo?.titulo ?? null,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{obra.titulo}</h1>
        <p className="text-sm text-muted">Linha do Tempo</p>
      </header>
      <NavegacaoObra obraId={obra.id} />

      <div className="mt-6">
        <GerenciadorLinhaDoTempo
          obraId={obra.id}
          eventosIniciais={eventos}
          capitulos={obra.capitulos}
        />
      </div>
    </main>
  );
}
