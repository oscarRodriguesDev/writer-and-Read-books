import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  criarCapituloComEstrutura,
} from "@/lib/services/capitulos";
import {
  detectarCapitulos,
  distribuirEmCenas,
  tituloPorNomeArquivo,
} from "@/lib/services/importar";
import { PARTES_TIPOS, CENAS_TIPOS, type ParteTipo, type CenaTipo } from "@/lib/constants";

export const dynamic = "force-dynamic";

const TAMANHO_MAX_ARQUIVO = 20 * 1024 * 1024; // 20 MB por arquivo

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const obraIdForm = form.get("obraId");
    const tituloNovaObra = String(form.get("tituloNovaObra") ?? "").trim();
    const arquivos = form.getAll("arquivos").filter((a): a is File => a instanceof File);

    if (arquivos.length === 0) {
      return NextResponse.json(
        { erro: "Selecione ao menos um arquivo .txt ou .pdf." },
        { status: 400 },
      );
    }
    for (const arquivo of arquivos) {
      if (arquivo.size > TAMANHO_MAX_ARQUIVO) {
        return NextResponse.json(
          { erro: `Arquivo "${arquivo.name}" excede o limite de 20 MB.` },
          { status: 400 },
        );
      }
    }

    // Resolve a obra: existente ou nova
    let obraId: string;
    if (typeof obraIdForm === "string" && obraIdForm.length > 0) {
      const obra = await prisma.obra.findUnique({ where: { id: obraIdForm } });
      if (!obra) {
        return NextResponse.json({ erro: "Obra não encontrada." }, { status: 404 });
      }
      obraId = obra.id;
    } else if (tituloNovaObra.length > 0) {
      const nova = await prisma.obra.create({
        data: {
          titulo: tituloNovaObra.slice(0, 200),
          status: "ESCRITA",
          esqueleto: { create: {} },
        },
      });
      obraId = nova.id;
    } else {
      return NextResponse.json(
        { erro: "Informe o título da nova obra ou selecione uma obra existente." },
        { status: 400 },
      );
    }

    // Ordena capítulos importados na ordem narrativa global da obra
    const ultimoPosicionado = await prisma.capitulo.findFirst({
      where: { obraId, ordemNarrativa: { not: null } },
      orderBy: { ordemNarrativa: "desc" },
      select: { ordemNarrativa: true },
    });
    let proximaPosicao = (ultimoPosicionado?.ordemNarrativa ?? 0) + 1;

    const capitulosCriados: string[] = [];

    for (const arquivo of arquivos) {
      const conteudo = await extrairTexto(arquivo);
      if (!conteudo.trim()) continue;

      const capitulos = detectarCapitulos(conteudo, tituloPorNomeArquivo(arquivo.name));

      for (const cap of capitulos) {
        const criado = await criarCapituloComEstrutura(obraId, { titulo: cap.titulo });

        // Distribui o conteúdo nas 9 cenas
        const textos = distribuirEmCenas(cap.conteudo);
        const partesOrdenadas = [...criado.partes].sort(
          (a, b) =>
            PARTES_TIPOS.indexOf(a.tipo as ParteTipo) -
            PARTES_TIPOS.indexOf(b.tipo as ParteTipo),
        );
        let i = 0;
        await prisma.$transaction(async (tx) => {
          for (const parte of partesOrdenadas) {
            const cenasOrdenadas = [...parte.cenas].sort(
              (a, b) =>
                CENAS_TIPOS.indexOf(a.tipo as CenaTipo) -
                CENAS_TIPOS.indexOf(b.tipo as CenaTipo),
            );
            for (const cena of cenasOrdenadas) {
              await tx.cena.update({
                where: { id: cena.id },
                data: { conteudo: textos[i] ?? "" },
              });
              i++;
            }
          }
          // Importação define posição narrativa automaticamente (RF-13)
          await tx.capitulo.update({
            where: { id: criado.id },
            data: { ordemNarrativa: proximaPosicao },
          });
        });
        proximaPosicao++;
        capitulosCriados.push(cap.titulo);
      }

      await prisma.importacaoArquivo.create({
        data: {
          obraId,
          nomeArquivo: arquivo.name.slice(0, 200),
          formato: /\.pdf$/i.test(arquivo.name) ? "PDF" : "TXT",
          tamanhoBytes: arquivo.size,
          conteudoImportado: null,
          mapeadoParaObra: true,
        },
      });
    }

    if (capitulosCriados.length === 0) {
      return NextResponse.json(
        { erro: "Não foi possível extrair texto dos arquivos enviados." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      obraId,
      capitulos: capitulosCriados.length,
    });
  } catch (e) {
    console.error("[importar] falha:", e);
    return NextResponse.json(
      { erro: "Falha ao processar a importação. Verifique os arquivos e tente novamente." },
      { status: 500 },
    );
  }
}

async function extrairTexto(arquivo: File): Promise<string> {
  if (/\.pdf$/i.test(arquivo.name) || arquivo.type === "application/pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const buffer = new Uint8Array(await arquivo.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });
    return typeof text === "string" ? text : "";
  }
  // TXT: tenta UTF-8; se houver caracteres de substituição, cai para Latin-1
  const buffer = await arquivo.arrayBuffer();
  let texto = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const quebras = (texto.match(/\uFFFD/g) ?? []).length;
  if (quebras > 2 || quebras / Math.max(texto.length, 1) > 0.01) {
    try {
      texto = new TextDecoder("windows-1252").decode(buffer);
    } catch {
      // mantém UTF-8 se windows-1252 indisponível no runtime
    }
  }
  return texto;
}
