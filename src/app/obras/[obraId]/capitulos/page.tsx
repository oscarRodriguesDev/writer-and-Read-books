import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CabecalhoObra } from "@/components/CabecalhoObra";
import { GerenciadorCapitulos } from "@/components/GerenciadorCapitulos";

export const dynamic = "force-dynamic";

export default async function CapitulosPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: {
      capitulos: {
        orderBy: [{ ordemNarrativa: "asc" }, { ordemEscrita: "asc" }],
      },
    },
  });
  if (!obra) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <CabecalhoObra
        obraId={obra.id}
        titulo={obra.titulo}
        subtitulo="Capítulos"
      />

      <div className="mt-6">
        <GerenciadorCapitulos obraId={obra.id} iniciais={obra.capitulos} />
      </div>
    </main>
  );
}
