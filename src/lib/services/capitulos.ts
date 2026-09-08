import { prisma } from "@/lib/db";
import { PARTES_TIPOS, CENAS_TIPOS, type ParteTipo } from "@/lib/constants";
import type { CriarCapituloInput } from "@/lib/validators";

/**
 * RN-01..03: cria o capítulo e, em transação, as 3 partes fixas com
 * 3 cenas cada (ordens 1..N). ordemEscrita é incremental por obra;
 * ordemNarrativa permanece null até o autor posicionar o capítulo.
 */
export async function criarCapituloComEstrutura(
  obraId: string,
  dados: CriarCapituloInput,
) {
  return prisma.$transaction(async (tx) => {
    const ultimo = await tx.capitulo.findFirst({
      where: { obraId },
      orderBy: { ordemEscrita: "desc" },
      select: { ordemEscrita: true },
    });
    const capitulo = await tx.capitulo.create({
      data: {
        obraId,
        titulo: dados.titulo,
        objetivo: dados.objetivo ?? null,
        ordemEscrita: (ultimo?.ordemEscrita ?? 0) + 1,
      },
    });
    for (const parteTipo of PARTES_TIPOS) {
      const parte = await tx.parte.create({
        data: { capituloId: capitulo.id, tipo: parteTipo },
      });
      for (const [i, cenaTipo] of CENAS_TIPOS.entries()) {
        await tx.cena.create({
          data: { parteId: parte.id, tipo: cenaTipo, ordem: i + 1 },
        });
      }
    }
    const resultado = await tx.capitulo.findUniqueOrThrow({
      where: { id: capitulo.id },
      include: { partes: { include: { cenas: true } } },
    });
    // Ordena pelos tipos canônicos (String não preserva ordem semântica)
    resultado.partes.sort(
      (a, b) =>
        PARTES_TIPOS.indexOf(a.tipo as ParteTipo) -
        PARTES_TIPOS.indexOf(b.tipo as ParteTipo),
    );
    for (const parte of resultado.partes) {
      parte.cenas.sort((a, b) => a.ordem - b.ordem);
    }
    return resultado;
  });
}

/**
 * Reordenação transacional por troca de posição na lista narrativa.
 * Capítulos sem posição (ordemNarrativa null) ficam no fim da lista.
 * Ao final, todos os posicionados são renumerados sequencialmente.
 */
export async function moverCapitulo(
  obraId: string,
  capituloId: string,
  direcao: "CIMA" | "BAIXO",
) {
  const capitulos = await prisma.capitulo.findMany({
    where: { obraId },
    orderBy: [{ ordemNarrativa: "asc" }, { ordemEscrita: "asc" }],
    select: { id: true, ordemNarrativa: true },
  });
  // findMany ordena nulls primeiro em SQLite; reordenamos para nulls por último
  const lista = [...capitulos].sort(
    (a, b) =>
      (a.ordemNarrativa === null ? 1 : 0) -
        (b.ordemNarrativa === null ? 1 : 0) ||
      (a.ordemNarrativa ?? 0) - (b.ordemNarrativa ?? 0),
  );
  const idx = lista.findIndex((c) => c.id === capituloId);
  if (idx === -1) throw new Error("CAPITULO_NAO_ENCONTRADO");
  const alvoIdx = direcao === "CIMA" ? idx - 1 : idx + 1;
  if (alvoIdx < 0 || alvoIdx >= lista.length) return lista;

  const novaLista = [...lista];
  [novaLista[idx], novaLista[alvoIdx]] = [novaLista[alvoIdx], novaLista[idx]];

  // Regras de posicionamento após a troca:
  // - capítulos já posicionados permanecem posicionados;
  // - se a troca envolve um posicionado e um pendente, o pendente passa a ser
  //   posicionado (troca efetiva entre os dois mundos);
  // - troca entre dois pendentes não gera posições novas.
  const origemPosicionada = lista[idx].ordemNarrativa !== null;
  const alvoPosicionado = lista[alvoIdx].ordemNarrativa !== null;
  const mista = origemPosicionada !== alvoPosicionado;

  await prisma.$transaction(async (tx) => {
    await tx.capitulo.updateMany({
      where: { obraId },
      data: { ordemNarrativa: null },
    });
    let posicao = 1;
    for (const c of novaLista) {
      const posicionado =
        c.ordemNarrativa !== null || (mista && c.id === capituloId);
      if (!posicionado) continue;
      await tx.capitulo.update({
        where: { id: c.id },
        data: { ordemNarrativa: posicao++ },
      });
    }
  });

  return novaLista;
}
