import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PARTES_TIPOS, type ParteTipo } from "@/lib/constants";
import { VisorCapitulo } from "@/components/VisorCapitulo";
import { btnSecundario } from "@/components/ui";
import { obterObraDoUsuario } from "@/lib/auth-obras";

export const dynamic = "force-dynamic";

export default async function EditorCapituloPage({
  params,
}: {
  params: Promise<{ obraId: string; capituloId: string }>;
}) {
  const { obraId, capituloId } = await params;
  const dono = await obterObraDoUsuario(obraId);
  const [obra, capitulo] = await Promise.all([
    dono
      ? prisma.obra.findUnique({
          where: { id: obraId },
          select: {
            idioma: true,
            personagens: { select: { id: true, nome: true }, orderBy: { nome: "asc" } },
            ambientes: { select: { id: true, nome: true }, orderBy: { nome: "asc" } },
          },
        })
      : Promise.resolve(null),
    prisma.capitulo.findUnique({
      where: { id: capituloId },
      include: {
        partes: {
          include: {
            cenas: {
              include: {
                personagens: true,
                ambientes: true,
              },
            },
          },
        },
      },
    }),
  ]);
  if (!obra || !capitulo || capitulo.obraId !== obraId) notFound();

  // Ordena pelos tipos canônicos INICIO → MEIO → FIM
  capitulo.partes.sort(
    (a, b) =>
      PARTES_TIPOS.indexOf(a.tipo as ParteTipo) -
      PARTES_TIPOS.indexOf(b.tipo as ParteTipo),
  );
  for (const parte of capitulo.partes) {
    parte.cenas.sort((a, b) => a.ordem - b.ordem);
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 pt-4">
        <Link href={`/ler/${obraId}`} className={`inline-block ${btnSecundario}`}>
          📖 Modo leitor
        </Link>
      </div>
      <VisorCapitulo
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
              ordem: cena.ordem,
              titulo: cena.titulo,
              conteudo: cena.conteudo,
              objetivo: cena.objetivo,
              personagensIds: cena.personagens.map((cp) => cp.personagemId),
              ambientesIds: cena.ambientes.map((ca) => ca.ambienteId),
            })),
          })),
        }}
        elenco={obra.personagens}
        ambientesObra={obra.ambientes}
        idioma={obra.idioma}
      />
    </>
  );
}
