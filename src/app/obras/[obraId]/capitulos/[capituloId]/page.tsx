import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PARTES_TIPOS, CENAS_TIPOS, type ParteTipo, type CenaTipo } from "@/lib/constants";
import { EditorCapitulo } from "@/components/EditorCapitulo";
import { btnSecundario } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditorCapituloPage({
  params,
}: {
  params: Promise<{ obraId: string; capituloId: string }>;
}) {
  const { obraId, capituloId } = await params;
  const capitulo = await prisma.capitulo.findUnique({
    where: { id: capituloId },
    include: { partes: { include: { cenas: true } } },
  });
  if (!capitulo || capitulo.obraId !== obraId) notFound();

  // Ordena pelos tipos canônicos INICIO → MEIO → FIM
  capitulo.partes.sort(
    (a, b) =>
      PARTES_TIPOS.indexOf(a.tipo as ParteTipo) -
      PARTES_TIPOS.indexOf(b.tipo as ParteTipo),
  );
  for (const parte of capitulo.partes) {
    parte.cenas.sort(
      (a, b) =>
        CENAS_TIPOS.indexOf(a.tipo as CenaTipo) -
        CENAS_TIPOS.indexOf(b.tipo as CenaTipo),
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 pt-4">
        <Link href={`/ler/${obraId}`} className={`inline-block ${btnSecundario}`}>
          📖 Modo leitor
        </Link>
      </div>
      <EditorCapitulo
        obraId={obraId}
        capitulo={{
          id: capitulo.id,
          titulo: capitulo.titulo,
          objetivo: capitulo.objetivo,
          partes: capitulo.partes.map((parte) => ({
            id: parte.id,
            tipo: parte.tipo,
            cenas: parte.cenas.map((cena) => ({
              id: cena.id,
              tipo: cena.tipo,
              titulo: cena.titulo,
              conteudo: cena.conteudo,
              objetivo: cena.objetivo,
            })),
          })),
        }}
      />
    </>
  );
}
