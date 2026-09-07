import { notFound } from "next/navigation";
import { CabecalhoObra } from "@/components/CabecalhoObra";
import {
  GerenciadorLinhaDoTempo,
  type EventoDados,
} from "@/components/GerenciadorLinhaDoTempo";
import { obterObraDoUsuario } from "@/lib/auth-obras";

export const dynamic = "force-dynamic";

export default async function LinhaDoTempoPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await obterObraDoUsuario(obraId, {
    eventos: {
      orderBy: { ordemCronologica: "asc" },
      include: { capitulo: { select: { titulo: true } } },
    },
    capitulos: { select: { id: true, titulo: true }, orderBy: { ordemEscrita: "asc" } },
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
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <CabecalhoObra
        obraId={obra.id}
        titulo={obra.titulo}
        subtitulo="Linha do Tempo"
      />

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
