import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CabecalhoObra } from "@/components/CabecalhoObra";
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
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <CabecalhoObra
        obraId={obra.id}
        titulo={obra.titulo}
        subtitulo="Esqueleto narrativo"
      />

      <div className={`mt-6 ${cardCls}`}>
        <FormEsqueleto obraId={obra.id} inicial={obra.esqueleto ?? {}} />
      </div>
    </main>
  );
}
