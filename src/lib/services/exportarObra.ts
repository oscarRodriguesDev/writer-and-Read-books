import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { PARTES_TIPOS, CENAS_TIPOS, type ParteTipo, type CenaTipo } from "@/lib/constants";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// EPUB
import EPub from "epub-gen";
// PDF
import PDFDocument from "pdfkit";
// DOCX
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType } from "docx";

export type FormatoExportacao = "epub" | "pdf" | "docx" | "kindle";

export interface CapituloExportacao {
  id: string;
  titulo: string;
  objetivo?: string | null;
  partes: {
    tipo: string;
    texto: string;
  }[];
}

export interface ObraExportacao {
  id: string;
  titulo: string;
  genero?: string | null;
  subgenero?: string | null;
  tema?: string | null;
  publicoAlvo?: string | null;
  descricao?: string | null;
  status: string;
  capitulos: CapituloExportacao[];
  totalPalavras: number;
}

/** Carrega a obra completa com todos os capítulos e cenas para exportação. */
export async function carregarObraParaExportacao(obraId: string): Promise<ObraExportacao> {
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: {
      capitulos: {
        include: { partes: { include: { cenas: true } } },
        orderBy: [{ ordemNarrativa: "asc" }, { ordemEscrita: "asc" }],
      },
    },
  });
  if (!obra) throw new ErroAplicacao("Obra não encontrada", 404);

  // Ordena partes e cenas semanticamente
  for (const capitulo of obra.capitulos) {
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
  }

  const capitulosExportacao: CapituloExportacao[] = obra.capitulos.map((cap) => ({
    id: cap.id,
    titulo: cap.titulo,
    objetivo: cap.objetivo,
    partes: cap.partes
      .map((parte) => ({
        tipo: parte.tipo,
        texto: parte.cenas
          .map((cena) => cena.conteudo.trim())
          .filter(Boolean)
          .join("\n\n"),
      }))
      .filter((p) => p.texto),
  }));

  // Conta palavras
  const cenas = await prisma.cena.findMany({
    where: { parte: { capitulo: { obraId } } },
    select: { conteudo: true },
  });
  const totalPalavras = cenas.reduce(
    (total, cena) =>
      total + (cena.conteudo.trim() ? cena.conteudo.trim().split(/\s+/).length : 0),
    0,
  );

  return {
    id: obra.id,
    titulo: obra.titulo,
    genero: obra.genero,
    subgenero: obra.subgenero,
    tema: obra.tema,
    publicoAlvo: obra.publicoAlvo,
    descricao: obra.descricao,
    status: obra.status,
    capitulos: capitulosExportacao,
    totalPalavras,
  };
}

/** Gera nome de arquivo seguro. */
function nomeArquivoSeguro(titulo: string, extensao: string): string {
  const seguro = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .toLowerCase();
  return `${seguro || "livro"}.${extensao}`;
}

/** Exporta para EPUB. */
export async function exportarEPUB(obra: ObraExportacao): Promise<Buffer> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "epub-"));

  try {
    const conteudoCapitulos = obra.capitulos
      .filter((cap) => cap.partes.some((p) => p.texto))
      .map((cap) => ({
        title: cap.titulo,
        data: cap.partes
          .filter((p) => p.texto)
          .map((p) => `<h2>${p.tipo === "INICIO" ? "Início" : p.tipo === "MEIO" ? "Meio" : "Fim"}</h2>${p.texto.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}`)
          .join("<hr>"),
      }));

    const opcoes = {
      title: obra.titulo,
      author: ["Autor"],
      publisher: "Book Writer App",
      content: conteudoCapitulos,
      output: path.join(tempDir, "livro.epub"),
      tocTitle: "Sumário",
      lang: "pt-BR",
      css: `
        body { font-family: Georgia, serif; line-height: 1.6; margin: 1em; }
        h1 { text-align: center; margin-bottom: 0.5em; font-size: 1.8em; }
        h2 { margin-top: 1.5em; margin-bottom: 0.5em; font-size: 1.3em; border-bottom: 1px solid #ccc; padding-bottom: 0.2em; }
        p { text-align: justify; margin: 0.5em 0; text-indent: 1.5em; }
        p:first-of-type { text-indent: 0; }
        hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; }
        .metadata { text-align: center; margin-bottom: 2em; font-size: 0.9em; color: #666; }
      `,
    };

    await new EPub(opcoes, path.join(tempDir, "livro.epub")).promise;
    const buffer = fs.readFileSync(path.join(tempDir, "livro.epub"));
    return buffer;
  } finally {
    // Limpa temp
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}

/** Exporta para PDF. */
export async function exportarPDF(obra: ObraExportacao): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 72, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Fonte - usa fontes padrão do PDFKit
    doc.font("Helvetica");

    // Capa / Título
    doc.fontSize(28).font("Helvetica-Bold").text(obra.titulo, { align: "center" });
    doc.moveDown(0.5);
    
    if (obra.genero) {
      doc.fontSize(14).font("Helvetica").text(`${obra.genero}${obra.subgenero ? ` · ${obra.subgenero}` : ""}`, { align: "center" });
      doc.moveDown(0.3);
    }
    
    doc.fontSize(12).font("Helvetica-Oblique").text(`Status: ${obra.status} · ${obra.totalPalavras.toLocaleString("pt-BR")} palavras`, { align: "center" });
    doc.moveDown(2);

    if (obra.descricao) {
      doc.fontSize(11).font("Helvetica").text(obra.descricao, { align: "justify" });
      doc.moveDown(2);
    }

    // Sumário
    doc.fontSize(16).font("Helvetica-Bold").text("Sumário", { align: "center" });
    doc.moveDown(1);
    
    obra.capitulos.forEach((cap, i) => {
      if (cap.partes.some((p) => p.texto)) {
        doc.fontSize(11).font("Helvetica").text(`${i + 1}. ${cap.titulo}`, { align: "left" });
      }
    });
    doc.addPage();

    // Capítulos
    obra.capitulos.forEach((cap, capIdx) => {
      if (!cap.partes.some((p) => p.texto)) return;

      // Título do capítulo
      doc.fontSize(18).font("Helvetica-Bold").text(`Capítulo ${capIdx + 1}: ${cap.titulo}`, { align: "center" });
      doc.moveDown(0.5);
      
      if (cap.objetivo) {
        doc.fontSize(10).font("Helvetica-Oblique").text(`Objetivo: ${cap.objetivo}`, { align: "center" });
        doc.moveDown(0.5);
      }
      
      doc.moveDown(1);

      // Partes do capítulo
      cap.partes.forEach((parte) => {
        if (!parte.texto) return;
        
        const rotuloParte = parte.tipo === "INICIO" ? "Início" : parte.tipo === "MEIO" ? "Meio" : "Fim";
        doc.fontSize(13).font("Helvetica-Bold").text(rotuloParte);
        doc.moveDown(0.3);
        
        // Texto da parte - processa parágrafos
        const paragrafos = parte.texto.split("\n\n").filter(Boolean);
        paragrafos.forEach((paragrafo, pIdx) => {
          doc.fontSize(11).font("Helvetica").text(paragrafo, { align: "justify", indent: 30 });
          doc.moveDown(0.4);
        });
        
        doc.moveDown(0.8);
      });

      // Quebra de página entre capítulos (exceto no último)
      if (capIdx < obra.capitulos.length - 1) {
        doc.addPage();
      }
    });

    doc.end();
  });
}

/** Exporta para DOCX. */
export async function exportarDOCX(obra: ObraExportacao): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Título
  children.push(
    new Paragraph({
      text: obra.titulo,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  );

  // Metadados
  const metadados: string[] = [];
  if (obra.genero) metadados.push(`Gênero: ${obra.genero}${obra.subgenero ? ` · ${obra.subgenero}` : ""}`);
  metadados.push(`Status: ${obra.status}`);
  metadados.push(`Palavras: ${obra.totalPalavras.toLocaleString("pt-BR")}`);
  
  children.push(
    new Paragraph({
      children: metadados.map((m) => new TextRun({ text: m, size: 22, italics: true })),
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
  );

  if (obra.descricao) {
    children.push(
      new Paragraph({
        text: obra.descricao,
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300 },
      }),
    );
  }

  // Sumário
  children.push(
    new Paragraph({
      text: "Sumário",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    }),
  );

  obra.capitulos.forEach((cap, i) => {
    if (cap.partes.some((p) => p.texto)) {
      children.push(
        new Paragraph({
          text: `${i + 1}. ${cap.titulo}`,
          spacing: { after: 100 },
        }),
      );
    }
  });

  children.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })] })); // Page break

  // Capítulos
  obra.capitulos.forEach((cap, capIdx) => {
    if (!cap.partes.some((p) => p.texto)) return;

    children.push(
      new Paragraph({
        text: `Capítulo ${capIdx + 1}: ${cap.titulo}`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
      }),
    );

    if (cap.objetivo) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Objetivo: ${cap.objetivo}`, italics: true, size: 22 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
      );
    }

    cap.partes.forEach((parte) => {
      if (!parte.texto) return;
      
      const rotuloParte = parte.tipo === "INICIO" ? "Início" : parte.tipo === "MEIO" ? "Meio" : "Fim";
      children.push(
        new Paragraph({
          text: rotuloParte,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
      );

      const paragrafos = parte.texto.split("\n\n").filter(Boolean);
      paragrafos.forEach((paragrafo) => {
        children.push(
          new Paragraph({
            text: paragrafo,
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: 720 }, // 0.5 inch
            spacing: { after: 120 },
          }),
        );
      });
    });

    // Page break entre capítulos (exceto último)
    if (capIdx < obra.capitulos.length - 1) {
      children.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }));
    }
  });

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

/** Exporta para Kindle (KFX/EPUB otimizado). 
 *  O Kindle aceita EPUB, então geramos um EPUB otimizado.
 *  Para MOBI/KFX real, precisaria do kindlegen (descontinuado) ou ferramentas externas.
 *  Aqui geramos EPUB com metadados Kindle-friendly. */
export async function exportarKindle(obra: ObraExportacao): Promise<Buffer> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kindle-"));

  try {
    const conteudoCapitulos = obra.capitulos
      .filter((cap) => cap.partes.some((p) => p.texto))
      .map((cap) => ({
        title: cap.titulo,
        data: cap.partes
          .filter((p) => p.texto)
          .map((p) => `<h2>${p.tipo === "INICIO" ? "Início" : p.tipo === "MEIO" ? "Meio" : "Fim"}</h2>${p.texto.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}`)
          .join("<hr>"),
      }));

    const opcoes = {
      title: obra.titulo,
      author: ["Autor"],
      publisher: "Book Writer App",
      content: conteudoCapitulos,
      output: path.join(tempDir, "livro.epub"),
      tocTitle: "Sumário",
      lang: "pt-BR",
      css: `
        @page { margin: 0.5in; }
        body { font-family: "Times New Roman", serif; line-height: 1.5; font-size: 1em; }
        h1 { text-align: center; margin-bottom: 1em; font-size: 1.6em; page-break-before: always; }
        h2 { margin-top: 1.2em; margin-bottom: 0.5em; font-size: 1.2em; }
        p { text-align: justify; margin: 0.4em 0; text-indent: 1.2em; orphans: 3; widows: 3; }
        p:first-of-type { text-indent: 0; }
        hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; page-break-after: avoid; }
        .chapter-title { page-break-before: always; text-align: center; margin-top: 3em; }
      `,
    };

    await new EPub(opcoes, path.join(tempDir, "livro.epub")).promise;
    const buffer = fs.readFileSync(path.join(tempDir, "livro.epub"));
    return buffer;
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}

/** Função principal de exportação. */
export async function exportarObra(obraId: string, formato: FormatoExportacao): Promise<{ buffer: Buffer; nomeArquivo: string; contentType: string }> {
  const obra = await carregarObraParaExportacao(obraId);

  let buffer: Buffer;
  let extensao: string;
  let contentType: string;

  switch (formato) {
    case "epub":
      buffer = await exportarEPUB(obra);
      extensao = "epub";
      contentType = "application/epub+zip";
      break;
    case "pdf":
      buffer = await exportarPDF(obra);
      extensao = "pdf";
      contentType = "application/pdf";
      break;
    case "docx":
      buffer = await exportarDOCX(obra);
      extensao = "docx";
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      break;
    case "kindle":
      buffer = await exportarKindle(obra);
      extensao = "epub"; // Kindle usa EPUB
      contentType = "application/epub+zip";
      break;
    default:
      throw new ErroAplicacao(`Formato não suportado: ${formato}`, 400);
  }

  return {
    buffer,
    nomeArquivo: nomeArquivoSeguro(obra.titulo, extensao),
    contentType,
  };
}