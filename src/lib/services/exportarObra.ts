import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { PARTES_TIPOS, CENAS_TIPOS, type ParteTipo, type CenaTipo } from "@/lib/constants";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import JSZip from "jszip";

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

/** Escapa XML/HTML para segurança. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "&apos;");
}

/** Converte texto simples para XHTML válido (parágrafos). */
function textoParaXhtml(texto: string): string {
  return texto
    .split("\n\n")
    .filter((p) => p.trim())
    .map((p) => `<p>${escapeXml(p.trim()).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

/** Gera o CSS para o EPUB. */
function gerarCss(kindle = false): string {
  if (kindle) {
    return `
@page { margin: 0.5in; }
body { font-family: "Times New Roman", serif; line-height: 1.5; font-size: 1em; }
h1 { text-align: center; margin-bottom: 1em; font-size: 1.6em; page-break-before: always; }
h2 { margin-top: 1.2em; margin-bottom: 0.5em; font-size: 1.2em; }
p { text-align: justify; margin: 0.4em 0; text-indent: 1.2em; orphans: 3; widows: 3; }
p:first-of-type { text-indent: 0; }
hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; page-break-after: avoid; }
.chapter-title { page-break-before: always; text-align: center; margin-top: 3em; }
    `.trim();
  }
  return `
body { font-family: Georgia, serif; line-height: 1.6; margin: 1em; }
h1 { text-align: center; margin-bottom: 0.5em; font-size: 1.8em; }
h2 { margin-top: 1.5em; margin-bottom: 0.5em; font-size: 1.3em; border-bottom: 1px solid #ccc; padding-bottom: 0.2em; }
p { text-align: justify; margin: 0.5em 0; text-indent: 1.5em; }
p:first-of-type { text-indent: 0; }
hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; }
.metadata { text-align: center; margin-bottom: 2em; font-size: 0.9em; color: #666; }
    `.trim();
}

/** Gera um UUID simples. */
function gerarUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Gera o content.opf (Package Document EPUB 3). */
function gerarOpf(
  obra: ObraExportacao,
  capitulosHtml: Array<{ id: string; href: string; title: string }>,
  uuid: string,
  kindle = false,
): string {
  const now = new Date().toISOString().split("T")[0];
  const dcId = `urn:uuid:${uuid}`;
  const manifestItems = [
    `    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `    <item id="nav" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `    <item id="css" href="style.css" media-type="text/css"/>`,
  ];
  const spineItems = [`    <itemref idref="nav" linear="no"/>`];

  capitulosHtml.forEach((cap, i) => {
    const itemId = `ch${i + 1}`;
    manifestItems.push(
      `    <item id="${itemId}" href="${cap.href}" media-type="application/xhtml+xml"/>`,
    );
    spineItems.push(`    <itemref idref="${itemId}"/>`);
  });

  const metadados = [
    `<dc:identifier id="bookid">${dcId}</dc:identifier>`,
    `<dc:title>${escapeXml(obra.titulo)}</dc:title>`,
    `<dc:language>pt-BR</dc:language>`,
    `<dc:creator id="creator">Autor</dc:creator>`,
    `<dc:publisher>Book Writer App</dc:publisher>`,
    `<dc:date>${now}</dc:date>`,
    `<meta property="dcterms:modified">${new Date().toISOString()}</meta>`,
    `<meta name="cover" content="cover-image"/>`,
  ];

  if (obra.genero) {
    metadados.push(`<dc:subject>${escapeXml(obra.genero)}${obra.subgenero ? ` · ${escapeXml(obra.subgenero)}` : ""}</dc:subject>`);
  }
  if (obra.descricao) {
    metadados.push(`<dc:description>${escapeXml(obra.descricao)}</dc:description>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0" prefix="rendition: http://www.idpf.org/vocab/rendition/#">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
${metadados.join("\n")}
  </metadata>
  <manifest>
${manifestItems.join("\n")}
  </manifest>
  <spine toc="ncx" page-progression-direction="ltr">
${spineItems.join("\n")}
  </spine>
  <guide>
    <reference type="toc" title="Sumário" href="toc.xhtml"/>
  </guide>
</package>`;
}

/** Gera o toc.ncx (NCX TOC para compatibilidade EPUB 2). */
function gerarNcx(obra: ObraExportacao, capitulosHtml: Array<{ id: string; href: string; title: string }>, uuid: string): string {
  const now = new Date().toISOString();
  const navPoints = capitulosHtml.map((cap, i) => `
    <navPoint id="${cap.id}" playOrder="${i + 1}">
      <navLabel><text>${escapeXml(cap.title)}</text></navLabel>
      <content src="${cap.href}"/>
    </navPoint>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="pt-BR">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(obra.titulo)}</text></docTitle>
  <docAuthor><text>Autor</text></docAuthor>
  <navMap>
${navPoints}
  </navMap>
</ncx>`;
}

/** Gera o toc.xhtml (HTML TOC para EPUB 3). */
function gerarTocXhtml(obra: ObraExportacao, capitulosHtml: Array<{ id: string; href: string; title: string }>): string {
  const items = capitulosHtml.map((cap) => `      <li><a href="${cap.href}">${escapeXml(cap.title)}</a></li>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="pt-BR">
  <head>
    <meta charset="UTF-8"/>
    <title>Sumário</title>
    <link rel="stylesheet" type="text/css" href="style.css"/>
  </head>
  <body>
    <nav epub:type="toc" id="toc">
      <h1>Sumário</h1>
      <ol>
${items}
      </ol>
    </nav>
  </body>
</html>`;
}

/** Gera o XHTML de um capítulo. */
function gerarCapituloXhtml(
  titulo: string,
  partes: Array<{ tipo: string; texto: string }>,
  cssHref = "style.css",
): string {
  const conteudo = partes
    .filter((p) => p.texto)
    .map((p) => {
      const rotulo = p.tipo === "INICIO" ? "Início" : p.tipo === "MEIO" ? "Meio" : "Fim";
      return `<h2>${escapeXml(rotulo)}</h2>\n${textoParaXhtml(p.texto)}`;
    })
    .join("\n<hr/>\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="pt-BR">
  <head>
    <meta charset="UTF-8"/>
    <title>${escapeXml(titulo)}</title>
    <link rel="stylesheet" type="text/css" href="${cssHref}"/>
  </head>
  <body>
    <h1>${escapeXml(titulo)}</h1>
${conteudo}
  </body>
</html>`;
}

/** Gera a página de capa/título. */
function gerarCapaXhtml(obra: ObraExportacao): string {
  const metadados = [];
  if (obra.genero) metadados.push(`Gênero: ${escapeXml(obra.genero)}${obra.subgenero ? ` · ${escapeXml(obra.subgenero)}` : ""}`);
  metadados.push(`Status: ${escapeXml(obra.status)}`);
  metadados.push(`Palavras: ${obra.totalPalavras.toLocaleString("pt-BR")}`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="pt-BR">
  <head>
    <meta charset="UTF-8"/>
    <title>${escapeXml(obra.titulo)}</title>
    <link rel="stylesheet" type="text/css" href="style.css"/>
  </head>
  <body>
    <div class="metadata">
      <h1>${escapeXml(obra.titulo)}</h1>
      ${metadados.map((m) => `<p>${m}</p>`).join("\n")}
      ${obra.descricao ? `<p>${escapeXml(obra.descricao)}</p>` : ""}
    </div>
  </body>
</html>`;
}

/** Exporta para EPUB usando JSZip (implementação nativa, sem dependências problemáticas). */
export async function exportarEPUB(obra: ObraExportacao, kindle = false): Promise<Buffer> {
  const zip = new JSZip();
  const uuid = gerarUuid();

  // 1. mimetype (deve ser o primeiro arquivo, sem compressão)
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // 2. META-INF/container.xml
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  // 3. CSS
  zip.file("OEBPS/style.css", gerarCss(kindle));

  // 4. Capa
  zip.file("OEBPS/capa.xhtml", gerarCapaXhtml(obra));

  // 5. Capítulos
  const capitulosHtml: Array<{ id: string; href: string; title: string }> = [];
  const capitulosValidos = obra.capitulos.filter((cap) => cap.partes.some((p) => p.texto));

  capitulosValidos.forEach((cap, i) => {
    const itemId = `ch${i + 1}`;
    const href = `${itemId}.xhtml`;
    const xhtml = gerarCapituloXhtml(cap.titulo, cap.partes);
    zip.file(`OEBPS/${href}`, xhtml);
    capitulosHtml.push({ id: itemId, href, title: cap.titulo });
  });

  // 6. TOC NCX
  zip.file("OEBPS/toc.ncx", gerarNcx(obra, capitulosHtml, uuid));

  // 7. TOC XHTML (NAV)
  zip.file("OEBPS/toc.xhtml", gerarTocXhtml(obra, capitulosHtml));

  // 8. content.opf
  zip.file("OEBPS/content.opf", gerarOpf(obra, capitulosHtml, uuid, kindle));

  // Gera o buffer final
  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  return buffer;
}

/** Exporta para PDF. */
export async function exportarPDF(obra: ObraExportacao): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 72, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

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

      doc.fontSize(18).font("Helvetica-Bold").text(`Capítulo ${capIdx + 1}: ${cap.titulo}`, { align: "center" });
      doc.moveDown(0.5);

      if (cap.objetivo) {
        doc.fontSize(10).font("Helvetica-Oblique").text(`Objetivo: ${cap.objetivo}`, { align: "center" });
        doc.moveDown(0.5);
      }

      doc.moveDown(1);

      cap.partes.forEach((parte) => {
        if (!parte.texto) return;

        const rotuloParte = parte.tipo === "INICIO" ? "Início" : parte.tipo === "MEIO" ? "Meio" : "Fim";
        doc.fontSize(13).font("Helvetica-Bold").text(rotuloParte);
        doc.moveDown(0.3);

        const paragrafos = parte.texto.split("\n\n").filter(Boolean);
        paragrafos.forEach((paragrafo) => {
          doc.fontSize(11).font("Helvetica").text(paragrafo, { align: "justify", indent: 30 });
          doc.moveDown(0.4);
        });

        doc.moveDown(0.8);
      });

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

  children.push(
    new Paragraph({
      text: obra.titulo,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  );

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

  children.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }));

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
            indent: { firstLine: 720 },
            spacing: { after: 120 },
          }),
        );
      });
    });

    if (capIdx < obra.capitulos.length - 1) {
      children.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }));
    }
  });

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

/** Exporta para Kindle (EPUB otimizado para Kindle). */
export async function exportarKindle(obra: ObraExportacao): Promise<Buffer> {
  return exportarEPUB(obra, true);
}

/** Função principal de exportação. */
export async function exportarObra(obraId: string, formato: FormatoExportacao): Promise<{ buffer: Buffer; nomeArquivo: string; contentType: string }> {
  const obra = await carregarObraParaExportacao(obraId);

  let buffer: Buffer;
  let extensao: string;
  let contentType: string;

  switch (formato) {
    case "epub":
      buffer = await exportarEPUB(obra, false);
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
      extensao = "epub";
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