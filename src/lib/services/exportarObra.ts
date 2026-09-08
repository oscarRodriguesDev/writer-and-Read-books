import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { PARTES_TIPOS, type ParteTipo } from "@/lib/constants";
import { htmlParaTexto } from "@/lib/html";
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
  subtitulo?: string | null;
  genero?: string | null;
  subgenero?: string | null;
  tema?: string | null;
  publicoAlvo?: string | null;
  descricao?: string | null;
  status: string;
  // Metadados de publicação
  isbn?: string | null;
  isbn13?: string | null;
  idioma?: string;
  dataPublicacao?: string | null;
  editora?: string | null;
  edicao?: string | null;
  direitosAutorais?: string | null;
  capaUrl?: string | null;
  capitulos: CapituloExportacao[];
  totalPalavras: number;
}

/** ObraExportacao estendida com metadados computados para exportação. */
export interface ObraExportacaoCompleta extends ObraExportacao {
  _autores: Array<{ nome: string; papel: string; ordem: number }>;
  _categorias: Array<{ codigo: string; nome: string; principal: boolean }>;
  _palavrasChave: string[];
}

/** Carrega a obra completa com todos os capítulos e cenas para exportação. */
export async function carregarObraParaExportacao(obraId: string): Promise<ObraExportacaoCompleta> {
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: {
      capitulos: {
        include: { partes: { include: { cenas: true } } },
        orderBy: [{ ordemNarrativa: "asc" }, { ordemEscrita: "asc" }],
      },
      autores: {
        include: { autor: true },
        orderBy: { ordem: "asc" },
      },
      categorias: {
        include: { categoria: true },
      },
      palavrasChave: true,
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
      parte.cenas.sort((a, b) => a.ordem - b.ordem);
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
          .map((cena) => htmlParaTexto(cena.conteudo))
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
    (total, cena) => {
      const texto = htmlParaTexto(cena.conteudo);
      return total + (texto ? texto.split(/\s+/).length : 0);
    },
    0,
  );

  // Prepara autores para metadados
  const autores = obra.autores.map((ao) => ({
    nome: ao.autor.nome,
    papel: ao.papel,
    ordem: ao.ordem,
  }));

  // Prepara categorias
  const categorias = obra.categorias.map((co) => ({
    codigo: co.categoria.codigo,
    nome: co.categoria.nome,
    principal: co.principal,
  }));

  // Prepara palavras-chave
  const palavrasChave = obra.palavrasChave.map((p) => p.termo);

  return {
    id: obra.id,
    titulo: obra.titulo,
    subtitulo: obra.subtitulo,
    genero: obra.genero,
    subgenero: obra.subgenero,
    tema: obra.tema,
    publicoAlvo: obra.publicoAlvo,
    descricao: obra.descricao,
    status: obra.status,
    isbn: obra.isbn,
    isbn13: obra.isbn13,
    idioma: obra.idioma,
    dataPublicacao: obra.dataPublicacao?.toISOString() ?? null,
    editora: obra.editora,
    edicao: obra.edicao,
    direitosAutorais: obra.direitosAutorais,
    capaUrl: obra.capaUrl,
    capitulos: capitulosExportacao,
    totalPalavras,
    // Campos extras para uso nas funções de geração
    _autores: autores,
    _categorias: categorias,
    _palavrasChave: palavrasChave,
  } as ObraExportacao & {
    _autores: Array<{ nome: string; papel: string; ordem: number }>;
    _categorias: Array<{ codigo: string; nome: string; principal: boolean }>;
    _palavrasChave: string[];
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
  obra: ObraExportacaoCompleta,
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

  // Capa (se houver imagem)
  if (obra.capaUrl) {
    manifestItems.push(`    <item id="cover-image" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>`);
    spineItems.unshift(`    <itemref idref="cover-image" linear="no"/>`);
  }

  capitulosHtml.forEach((cap, i) => {
    const itemId = `ch${i + 1}`;
    manifestItems.push(
      `    <item id="${itemId}" href="${cap.href}" media-type="application/xhtml+xml"/>`,
    );
    spineItems.push(`    <itemref idref="${itemId}"/>`);
  });

  // Página de créditos
  manifestItems.push(`    <item id="creditos" href="creditos.xhtml" media-type="application/xhtml+xml"/>`);
  spineItems.push(`    <itemref idref="creditos"/>`);

  const metadados = [
    `<dc:identifier id="bookid">${dcId}</dc:identifier>`,
    `<dc:title>${escapeXml(obra.titulo)}</dc:title>`,
    `<dc:language>${escapeXml(obra.idioma || "pt-BR")}</dc:language>`,
    `<dc:publisher>${escapeXml(obra.editora || "Book Writer App")}</dc:publisher>`,
    `<dc:date>${obra.dataPublicacao ? escapeXml(obra.dataPublicacao.split("T")[0]) : now}</dc:date>`,
    `<meta property="dcterms:modified">${new Date().toISOString()}</meta>`,
  ];

  // Autores com roles (marc:relators)
  obra._autores.forEach((autor, idx) => {
    const creatorId = `creator${idx + 1}`;
    const roleMap: Record<string, string> = {
      AUTOR: "aut",
      COAUTOR: "aut",
      ORGANIZADOR: "edt",
      TRADUTOR: "trl",
      ILUSTRADOR: "ill",
      PREFACIADOR: "prf",
      POSFACIADOR: "aft",
    };
    const role = roleMap[autor.papel] || "aut";
    metadados.push(`<dc:creator id="${creatorId}">${escapeXml(autor.nome)}</dc:creator>`);
    metadados.push(`<meta refines="#${creatorId}" property="role" scheme="marc:relators">${role}</meta>`);
    metadados.push(`<meta refines="#${creatorId}" property="display-seq">${autor.ordem || idx + 1}</meta>`);
  });

  // ISBN
  if (obra.isbn13) {
    metadados.push(`<dc:identifier id="isbn13" scheme="ISBN">${escapeXml(obra.isbn13)}</dc:identifier>`);
  } else if (obra.isbn) {
    metadados.push(`<dc:identifier id="isbn" scheme="ISBN">${escapeXml(obra.isbn)}</dc:identifier>`);
  }

  // Gênero/categorias
  if (obra.genero) {
    metadados.push(`<dc:subject>${escapeXml(obra.genero)}${obra.subgenero ? ` · ${escapeXml(obra.subgenero)}` : ""}</dc:subject>`);
  }
  // Categorias BISAC/CLIL
  obra._categorias.forEach((cat) => {
    if (cat.codigo) {
      metadados.push(`<dc:subject scheme="BISAC">${escapeXml(cat.codigo)}</dc:subject>`);
    }
    metadados.push(`<dc:subject>${escapeXml(cat.nome)}</dc:subject>`);
  });

  // Palavras-chave
  obra._palavrasChave.forEach((kw) => {
    metadados.push(`<dc:subject>${escapeXml(kw)}</dc:subject>`);
  });

  // Descrição
  if (obra.descricao) {
    metadados.push(`<dc:description>${escapeXml(obra.descricao)}</dc:description>`);
  }

  // Direitos autorais
  if (obra.direitosAutorais) {
    metadados.push(`<dc:rights>${escapeXml(obra.direitosAutorais)}</dc:rights>`);
  }

  // Capa
  if (obra.capaUrl) {
    metadados.push(`<meta name="cover" content="cover-image"/>`);
  }

  // Edição
  if (obra.edicao && obra.edicao !== "1") {
    metadados.push(`<meta property="dcterms:edition">${escapeXml(obra.edicao)}</meta>`);
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
    <reference type="credits" title="Créditos" href="creditos.xhtml"/>
  </guide>
</package>`;
}

/** Gera o toc.ncx (NCX TOC para compatibilidade EPUB 2). */
function gerarNcx(
  obra: ObraExportacaoCompleta,
  capitulosHtml: Array<{ id: string; href: string; title: string }>,
  uuid: string,
): string {
  const now = new Date().toISOString();
  const autorPrincipal = obra._autores.find((a) => a.papel === "AUTOR") || obra._autores[0];
  const navPoints = capitulosHtml.map((cap, i) => `
    <navPoint id="${cap.id}" playOrder="${i + 1}">
      <navLabel><text>${escapeXml(cap.title)}</text></navLabel>
      <content src="${cap.href}"/>
    </navPoint>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="${obra.idioma || "pt-BR"}">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(obra.titulo)}</text></docTitle>
  <docAuthor><text>${escapeXml(autorPrincipal?.nome || "Autor")}</text></docAuthor>
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
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${obra.idioma || "pt-BR"}">
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

/** Gera a página de créditos. */
function gerarCreditosXhtml(obra: ObraExportacaoCompleta): string {
  const autoresHtml = obra._autores
    .map((a) => {
      const papelLabel: Record<string, string> = {
        AUTOR: "Autor",
        COAUTOR: "Coautor",
        ORGANIZADOR: "Organizador",
        TRADUTOR: "Tradutor",
        ILUSTRADOR: "Ilustrador",
        PREFACIADOR: "Prefaciador",
        POSFACIADOR: "Posfaciador",
      };
      return `<p>${escapeXml(a.nome)} — ${papelLabel[a.papel] || a.papel}</p>`;
    })
    .join("\n");

  const categoriasHtml = obra._categorias
    .map((c) => `<li>${escapeXml(c.nome)}${c.codigo ? ` (${c.codigo})` : ""}${c.principal ? " <strong>[Principal]</strong>" : ""}</li>`)
    .join("\n");

  const palavrasChaveHtml = obra._palavrasChave.map((k) => `<span class="tag">${escapeXml(k)}</span>`).join(" ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${obra.idioma || "pt-BR"}">
  <head>
    <meta charset="UTF-8"/>
    <title>Créditos</title>
    <link rel="stylesheet" type="text/css" href="style.css"/>
  </head>
  <body>
    <div class="metadata">
      <h1>Créditos</h1>
      <h2>${escapeXml(obra.titulo)}${obra.subtitulo ? `: ${escapeXml(obra.subtitulo)}` : ""}</h2>
      
      <h3>Autores</h3>
      ${autoresHtml || "<p>Não informado</p>"}
      
      ${obra.editora ? `<h3>Editora</h3><p>${escapeXml(obra.editora)}</p>` : ""}
      ${obra.edicao && obra.edicao !== "1" ? `<h3>Edição</h3><p>${escapeXml(obra.edicao)}</p>` : ""}
      ${obra.dataPublicacao ? `<h3>Data de publicação</h3><p>${escapeXml(new Date(obra.dataPublicacao).toLocaleDateString("pt-BR"))}</p>` : ""}
      
      <h3>ISBN</h3>
      <p>${obra.isbn13 ? escapeXml(obra.isbn13) : obra.isbn ? escapeXml(obra.isbn) : "Não informado"}</p>
      
      <h3>Idioma</h3>
      <p>${escapeXml(obra.idioma || "pt-BR")}</p>
      
      ${obra.direitosAutorais ? `<h3>Direitos autorais</h3><p>${escapeXml(obra.direitosAutorais)}</p>` : ""}
      
      ${categoriasHtml ? `
      <h3>Categorias</h3>
      <ul>${categoriasHtml}</ul>
      ` : ""}
      
      ${palavrasChaveHtml ? `
      <h3>Palavras-chave</h3>
      <p>${palavrasChaveHtml}</p>
      ` : ""}
      
      <hr/>
      <p class="metadata">Gerado por Book Writer App</p>
    </div>
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
  if (obra.subtitulo) metadados.push(`<h2>${escapeXml(obra.subtitulo)}</h2>`);
  if (obra.genero) metadados.push(`<p>Gênero: ${escapeXml(obra.genero)}${obra.subgenero ? ` · ${escapeXml(obra.subgenero)}` : ""}</p>`);
  metadados.push(`<p>Status: ${escapeXml(obra.status)}</p>`);
  metadados.push(`<p>Palavras: ${obra.totalPalavras.toLocaleString("pt-BR")}</p>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${obra.idioma || "pt-BR"}">
  <head>
    <meta charset="UTF-8"/>
    <title>${escapeXml(obra.titulo)}</title>
    <link rel="stylesheet" type="text/css" href="style.css"/>
  </head>
  <body>
    <div class="metadata">
      <h1>${escapeXml(obra.titulo)}</h1>
      ${metadados.join("\n")}
      ${obra.descricao ? `<p>${escapeXml(obra.descricao)}</p>` : ""}
    </div>
  </body>
</html>`;
}

/** Exporta para EPUB usando JSZip (implementação nativa, sem dependências problemáticas). */
export async function exportarEPUB(obra: ObraExportacaoCompleta, kindle = false): Promise<Buffer> {
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

  // 6. Créditos
  zip.file("OEBPS/creditos.xhtml", gerarCreditosXhtml(obra));

  // 7. TOC NCX
  zip.file("OEBPS/toc.ncx", gerarNcx(obra, capitulosHtml, uuid));

  // 8. TOC XHTML (NAV)
  zip.file("OEBPS/toc.xhtml", gerarTocXhtml(obra, capitulosHtml));

  // 9. content.opf
  zip.file("OEBPS/content.opf", gerarOpf(obra, capitulosHtml, uuid, kindle));

  // 10. Imagem de capa (se houver URL local)
  if (obra.capaUrl && obra.capaUrl.startsWith("/uploads/")) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const fullPath = path.join(process.cwd(), "public", obra.capaUrl);
      if (fs.existsSync(fullPath)) {
        const imageBuffer = fs.readFileSync(fullPath);
        zip.file("OEBPS/images/cover.jpg", imageBuffer);
      }
    } catch {
      // Ignora erro de imagem - EPUB ainda será válido sem capa
    }
  }

  // Gera o buffer final
  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  return buffer;
}

/** Exporta para PDF. */
export async function exportarPDF(obra: ObraExportacaoCompleta): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 72, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica");

    // Capa / Título
    doc.fontSize(28).font("Helvetica-Bold").text(obra.titulo, { align: "center" });
    if (obra.subtitulo) {
      doc.moveDown(0.3);
      doc.fontSize(16).font("Helvetica-Oblique").text(obra.subtitulo, { align: "center" });
    }
    doc.moveDown(0.5);

    if (obra.genero) {
      doc.fontSize(14).font("Helvetica").text(`${obra.genero}${obra.subgenero ? ` · ${obra.subgenero}` : ""}`, { align: "center" });
      doc.moveDown(0.3);
    }

    // Autores
    if (obra._autores.length > 0) {
      const autorPrincipal = obra._autores.find((a) => a.papel === "AUTOR") || obra._autores[0];
      doc.fontSize(12).font("Helvetica").text(`Por ${autorPrincipal.nome}`, { align: "center" });
      if (obra._autores.length > 1) {
        const outros = obra._autores.filter((a) => a !== autorPrincipal);
        outros.forEach((a) => {
          const papelLabel: Record<string, string> = {
            COAUTOR: "Coautor",
            ORGANIZADOR: "Organizador",
            TRADUTOR: "Tradutor",
            ILUSTRADOR: "Ilustrador",
            PREFACIADOR: "Prefaciador",
            POSFACIADOR: "Posfaciador",
          };
          doc.fontSize(11).font("Helvetica-Oblique").text(`${papelLabel[a.papel] || a.papel}: ${a.nome}`, { align: "center" });
        });
      }
      doc.moveDown(0.3);
    }

    doc.fontSize(12).font("Helvetica-Oblique").text(`${obra.totalPalavras.toLocaleString("pt-BR")} palavras`, { align: "center" });
    doc.moveDown(2);

    if (obra.descricao) {
      doc.fontSize(11).font("Helvetica").text(obra.descricao, { align: "justify" });
      doc.moveDown(2);
    }

    // Metadados de publicação na capa
    const metadadosPub: string[] = [];
    if (obra.editora) metadadosPub.push(`Editora: ${obra.editora}`);
    if (obra.edicao && obra.edicao !== "1") metadadosPub.push(`Edição: ${obra.edicao}`);
    if (obra.dataPublicacao) metadadosPub.push(`Publicado em: ${new Date(obra.dataPublicacao).toLocaleDateString("pt-BR")}`);
    if (obra.isbn13) metadadosPub.push(`ISBN-13: ${obra.isbn13}`);
    else if (obra.isbn) metadadosPub.push(`ISBN: ${obra.isbn}`);
    if (obra.direitosAutorais) metadadosPub.push(`Direitos: ${obra.direitosAutorais}`);
    
    if (metadadosPub.length > 0) {
      doc.fontSize(10).font("Helvetica");
      metadadosPub.forEach((m) => {
        doc.text(m, { align: "center" });
        doc.moveDown(0.2);
      });
      doc.moveDown(1);
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

    // Página de créditos no final
    doc.addPage();
    doc.fontSize(16).font("Helvetica-Bold").text("Créditos", { align: "center" });
    doc.moveDown(1);

    doc.fontSize(14).font("Helvetica-Bold").text(obra.titulo, { align: "center" });
    if (obra.subtitulo) {
      doc.moveDown(0.3);
      doc.fontSize(12).font("Helvetica-Oblique").text(obra.subtitulo, { align: "center" });
    }
    doc.moveDown(1);

    // Autores
    if (obra._autores.length > 0) {
      doc.fontSize(12).font("Helvetica-Bold").text("Autores", { align: "left" });
      doc.moveDown(0.5);
      obra._autores.forEach((a) => {
        const papelLabel: Record<string, string> = {
          AUTOR: "Autor",
          COAUTOR: "Coautor",
          ORGANIZADOR: "Organizador",
          TRADUTOR: "Tradutor",
          ILUSTRADOR: "Ilustrador",
          PREFACIADOR: "Prefaciador",
          POSFACIADOR: "Posfaciador",
        };
        doc.fontSize(11).font("Helvetica").text(`${a.nome} — ${papelLabel[a.papel] || a.papel}`, { align: "left" });
      });
      doc.moveDown(1);
    }

    // Dados de publicação
    const creditos: string[] = [];
    if (obra.editora) creditos.push(`Editora: ${obra.editora}`);
    if (obra.edicao && obra.edicao !== "1") creditos.push(`Edição: ${obra.edicao}`);
    if (obra.dataPublicacao) creditos.push(`Data de publicação: ${new Date(obra.dataPublicacao).toLocaleDateString("pt-BR")}`);
    if (obra.isbn13) creditos.push(`ISBN-13: ${obra.isbn13}`);
    else if (obra.isbn) creditos.push(`ISBN: ${obra.isbn}`);
    if (obra.idioma) creditos.push(`Idioma: ${obra.idioma}`);
    if (obra.direitosAutorais) creditos.push(`Direitos autorais: ${obra.direitosAutorais}`);
    
    creditos.forEach((c) => {
      doc.fontSize(11).font("Helvetica").text(c, { align: "left" });
      doc.moveDown(0.3);
    });

    // Categorias
    if (obra._categorias.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica-Bold").text("Categorias", { align: "left" });
      doc.moveDown(0.5);
      obra._categorias.forEach((c) => {
        doc.fontSize(11).font("Helvetica").text(`${c.nome}${c.codigo ? ` (${c.codigo})` : ""}${c.principal ? " [Principal]" : ""}`, { align: "left" });
      });
    }

    // Palavras-chave
    if (obra._palavrasChave.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica-Bold").text("Palavras-chave", { align: "left" });
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica").text(obra._palavrasChave.join(", "), { align: "left" });
    }

    doc.end();
  });
}

/** Exporta para DOCX. */
export async function exportarDOCX(obra: ObraExportacaoCompleta): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      text: obra.titulo,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  );

  if (obra.subtitulo) {
    children.push(
      new Paragraph({
        text: obra.subtitulo,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    );
  }

  const metadados: string[] = [];
  if (obra.genero) metadados.push(`Gênero: ${obra.genero}${obra.subgenero ? ` · ${obra.subgenero}` : ""}`);
  metadados.push(`Palavras: ${obra.totalPalavras.toLocaleString("pt-BR")}`);

  // Autores
  if (obra._autores.length > 0) {
    const autorPrincipal = obra._autores.find((a) => a.papel === "AUTOR") || obra._autores[0];
    metadados.push(`Autor: ${autorPrincipal.nome}`);
    if (obra._autores.length > 1) {
      const outros = obra._autores.filter((a) => a !== autorPrincipal);
      outros.forEach((a) => {
        const papelLabel: Record<string, string> = {
          COAUTOR: "Coautor",
          ORGANIZADOR: "Organizador",
          TRADUTOR: "Tradutor",
          ILUSTRADOR: "Ilustrador",
          PREFACIADOR: "Prefaciador",
          POSFACIADOR: "Posfaciador",
        };
        metadados.push(`${papelLabel[a.papel] || a.papel}: ${a.nome}`);
      });
    }
  }

  children.push(
    new Paragraph({
      children: metadados.map((m) => new TextRun({ text: m, size: 22, italics: true })),
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
  );

  // Metadados de publicação
  const pubData: string[] = [];
  if (obra.editora) pubData.push(`Editora: ${obra.editora}`);
  if (obra.edicao && obra.edicao !== "1") pubData.push(`Edição: ${obra.edicao}`);
  if (obra.dataPublicacao) pubData.push(`Publicado em: ${new Date(obra.dataPublicacao).toLocaleDateString("pt-BR")}`);
  if (obra.isbn13) pubData.push(`ISBN-13: ${obra.isbn13}`);
  else if (obra.isbn) pubData.push(`ISBN: ${obra.isbn}`);
  if (obra.direitosAutorais) pubData.push(`Direitos: ${obra.direitosAutorais}`);

  if (pubData.length > 0) {
    children.push(
      new Paragraph({
        children: pubData.map((m) => new TextRun({ text: m, size: 20, italics: true })),
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),
    );
  }

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

  // Página de créditos no final
  children.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }));
  children.push(
    new Paragraph({
      text: "Créditos",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    }),
  );

  children.push(
    new Paragraph({
      text: obra.titulo,
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
  );

  if (obra.subtitulo) {
    children.push(
      new Paragraph({
        text: obra.subtitulo,
        heading: HeadingLevel.HEADING_3,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    );
  }

  if (obra._autores.length > 0) {
    children.push(
      new Paragraph({
        text: "Autores",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
    );
    obra._autores.forEach((a) => {
      const papelLabel: Record<string, string> = {
        AUTOR: "Autor",
        COAUTOR: "Coautor",
        ORGANIZADOR: "Organizador",
        TRADUTOR: "Tradutor",
        ILUSTRADOR: "Ilustrador",
        PREFACIADOR: "Prefaciador",
        POSFACIADOR: "Posfaciador",
      };
      children.push(
        new Paragraph({
          text: `${a.nome} — ${papelLabel[a.papel] || a.papel}`,
          spacing: { after: 100 },
        }),
      );
    });
  }

  const creditos: string[] = [];
  if (obra.editora) creditos.push(`Editora: ${obra.editora}`);
  if (obra.edicao && obra.edicao !== "1") creditos.push(`Edição: ${obra.edicao}`);
  if (obra.dataPublicacao) creditos.push(`Data de publicação: ${new Date(obra.dataPublicacao).toLocaleDateString("pt-BR")}`);
  if (obra.isbn13) creditos.push(`ISBN-13: ${obra.isbn13}`);
  else if (obra.isbn) creditos.push(`ISBN: ${obra.isbn}`);
  if (obra.idioma) creditos.push(`Idioma: ${obra.idioma}`);
  if (obra.direitosAutorais) creditos.push(`Direitos autorais: ${obra.direitosAutorais}`);

  creditos.forEach((c) => {
    children.push(
      new Paragraph({
        text: c,
        spacing: { after: 100 },
      }),
    );
  });

  if (obra._categorias.length > 0) {
    children.push(
      new Paragraph({
        text: "Categorias",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
    );
    obra._categorias.forEach((c) => {
      children.push(
        new Paragraph({
          text: `${c.nome}${c.codigo ? ` (${c.codigo})` : ""}${c.principal ? " [Principal]" : ""}`,
          spacing: { after: 100 },
        }),
      );
    });
  }

  if (obra._palavrasChave.length > 0) {
    children.push(
      new Paragraph({
        text: "Palavras-chave",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
    );
    children.push(
      new Paragraph({
        text: obra._palavrasChave.join(", "),
        spacing: { after: 100 },
      }),
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

/** Exporta para Kindle (EPUB otimizado para Kindle). */
export async function exportarKindle(obra: ObraExportacaoCompleta): Promise<Buffer> {
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