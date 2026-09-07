import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CabecalhoObra } from "@/components/CabecalhoObra";
import { GerenciadorPersonagens } from "@/components/GerenciadorPersonagens";

export const dynamic = "force-dynamic";

export default async function PersonagensPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: { personagens: { orderBy: { criadoEm: "asc" } } },
  });
  if (!obra) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <CabecalhoObra
        obraId={obra.id}
        titulo={obra.titulo}
        subtitulo="Personagens"
      />

      <div className="mt-6">
        <GerenciadorPersonagens obraId={obra.id} iniciais={obra.personagens} />
      </div>
    </main>
  );
}
