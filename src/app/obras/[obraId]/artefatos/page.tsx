import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CabecalhoObra } from "@/components/CabecalhoObra";
import { GerenciadorArtefatos } from "@/components/GerenciadorArtefatos";

export const dynamic = "force-dynamic";

export default async function ArtefatosPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: { artefatos: { orderBy: { nome: "asc" } } },
  });
  if (!obra) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <CabecalhoObra
        obraId={obra.id}
        titulo={obra.titulo}
        subtitulo="Artefatos"
      />

      <div className="mt-6">
        <GerenciadorArtefatos obraId={obra.id} iniciais={obra.artefatos} />
      </div>
    </main>
  );
}