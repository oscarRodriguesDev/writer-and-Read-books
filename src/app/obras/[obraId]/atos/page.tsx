import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NavegacaoObra } from "@/components/NavegacaoObra";
import { GerenciadorAtos } from "@/components/GerenciadorAtos";

export const dynamic = "force-dynamic";

export default async function AtosPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: {
      atos: {
        orderBy: { ordem: "asc" },
        include: {
          capitulos: {
            orderBy: { ordemDentroDoAto: "asc" },
            select: { id: true, titulo: true, ordemDentroDoAto: true },
          },
        },
      },
      capitulos: {
        orderBy: [{ ordemNarrativa: "asc" }, { ordemEscrita: "asc" }],
        select: { id: true, titulo: true, atoId: true },
      },
    },
  });
  if (!obra) notFound();

  const capitulosSemAto = obra.capitulos
    .filter((c) => c.atoId === null)
    .map((c) => ({ id: c.id, titulo: c.titulo }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{obra.titulo}</h1>
        <p className="text-sm text-muted">Atos</p>
      </header>
      <NavegacaoObra obraId={obra.id} />

      <div className="mt-6">
        <GerenciadorAtos
          obraId={obra.id}
          atos={obra.atos}
          capitulosSemAto={capitulosSemAto}
        />
      </div>
    </main>
  );
}