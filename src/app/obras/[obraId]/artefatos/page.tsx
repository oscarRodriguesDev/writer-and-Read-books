import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NavegacaoObra } from "@/components/NavegacaoObra";
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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{obra.titulo}</h1>
        <p className="text-sm text-muted">Artefatos</p>
      </header>
      <NavegacaoObra obraId={obra.id} />

      <div className="mt-6">
        <GerenciadorArtefatos obraId={obra.id} iniciais={obra.artefatos} />
      </div>
    </main>
  );
}