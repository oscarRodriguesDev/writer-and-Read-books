import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NavegacaoObra } from "@/components/NavegacaoObra";
import { FormEsqueleto } from "@/components/FormEsqueleto";
import { cardCls } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EsqueletoPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: { esqueleto: true },
  });
  if (!obra) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{obra.titulo}</h1>
        <p className="text-sm text-muted">Esqueleto narrativo</p>
      </header>
      <NavegacaoObra obraId={obra.id} />

      <div className={`mt-6 ${cardCls}`}>
        <FormEsqueleto obraId={obra.id} inicial={obra.esqueleto ?? {}} />
      </div>
    </main>
  );
}
