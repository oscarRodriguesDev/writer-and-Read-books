import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NavegacaoObra } from "@/components/NavegacaoObra";
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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{obra.titulo}</h1>
        <p className="text-sm text-muted">Capítulos</p>
      </header>
      <NavegacaoObra obraId={obra.id} />

      <div className="mt-6">
        <GerenciadorCapitulos obraId={obra.id} iniciais={obra.capitulos} />
      </div>
    </main>
  );
}
