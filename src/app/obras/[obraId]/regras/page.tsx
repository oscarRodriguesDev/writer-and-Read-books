import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NavegacaoObra } from "@/components/NavegacaoObra";
import { GerenciadorRegras } from "@/components/GerenciadorRegras";

export const dynamic = "force-dynamic";

export default async function RegrasPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: { regras: { orderBy: [{ ativa: "desc" }, { descricao: "asc" }] } },
  });
  if (!obra) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{obra.titulo}</h1>
        <p className="text-sm text-muted">Regras do universo</p>
      </header>
      <NavegacaoObra obraId={obra.id} />

      <div className="mt-6">
        <GerenciadorRegras obraId={obra.id} iniciais={obra.regras} />
      </div>
    </main>
  );
}