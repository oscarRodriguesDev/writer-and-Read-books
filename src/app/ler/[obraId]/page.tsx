import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PARTES_TIPOS, CENAS_TIPOS, type ParteTipo, type CenaTipo } from "@/lib/constants";
import { btnSecundario } from "@/components/ui";
import LeitorLivro from "@/components/leitor/LeitorLivro";
import type { CapituloLeitura } from "@/lib/leitor";

export const dynamic = "force-dynamic";

export default async function LerPage({
  params,
  searchParams,
}: {
  params: Promise<{ obraId: string }>;
  searchParams: Promise<{ cap?: string; pag?: string }>;
}) {
  const { obraId } = await params;
  const { cap: capParam, pag: pagParam } = await searchParams;

  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) notFound();

  const capitulosBrutos = await prisma.capitulo.findMany({
    where: { obraId },
    include: { partes: { include: { cenas: true } } },
  });
  // Ordena narrativamente: posicionados primeiro, pendentes no fim
  const capitulos: CapituloLeitura[] = capitulosBrutos
    .sort(
      (a, b) =>
        (a.ordemNarrativa === null ? 1 : 0) -
          (b.ordemNarrativa === null ? 1 : 0) ||
        (a.ordemNarrativa ?? 0) - (b.ordemNarrativa ?? 0),
    )
    .map((capitulo) => ({
      id: capitulo.id,
      titulo: capitulo.titulo,
      partes: [...capitulo.partes]
        .sort(
          (a, b) =>
            PARTES_TIPOS.indexOf(a.tipo as ParteTipo) -
            PARTES_TIPOS.indexOf(b.tipo as ParteTipo),
        )
        .map((parte) => ({
          tipo: parte.tipo,
          paragrafos: parte.cenas
            .sort(
              (a, b) =>
                CENAS_TIPOS.indexOf(a.tipo as CenaTipo) -
                CENAS_TIPOS.indexOf(b.tipo as CenaTipo),
            )
            .map((cena) => cena.conteudo.trim())
            .filter(Boolean)
            .join("\n\n")
            .split("\n\n"),
        })),
    }));

  if (capitulos.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 text-center">
        <p className="mb-4">Esta obra ainda não tem capítulos.</p>
        <Link href={`/obras/${obraId}/capitulos`} className={btnSecundario}>
          Criar capítulos
        </Link>
      </main>
    );
  }

  const capInicial = Math.min(
    Math.max(0, Number(capParam ?? 0) || 0),
    capitulos.length - 1,
  );
  const pagInicial = Math.max(0, Number(pagParam ?? 0) || 0);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <LeitorLivro
        obraId={obraId}
        capitulos={capitulos}
        capInicial={capInicial}
        pagInicial={pagInicial}
      />
    </main>
  );
}