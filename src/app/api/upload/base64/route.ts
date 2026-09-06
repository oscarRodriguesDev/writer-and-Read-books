import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

/**
 * POST /api/upload/base64 — importa uma imagem codificada em Base64
 * (formato comum de respostas de APIs de geração de imagem, ex.: Gemini),
 * decodifica e salva como arquivo em public/uploads/, vinculando ao registro.
 *
 * Aceita tanto Base64 puro quanto Data URL ("data:image/png;base64,…").
 */

const TIPOS = ["personagem", "ambiente", "capitulo", "artefato"] as const;
type Tipo = (typeof TIPOS)[number];

const MIME_PARA_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const TAMANHO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

async function salvarImagemUrl(tipo: Tipo, id: string, url: string | null) {
  if (tipo === "personagem")
    await prisma.personagem.update({ where: { id }, data: { imagemUrl: url } });
  else if (tipo === "ambiente")
    await prisma.ambiente.update({ where: { id }, data: { imagemUrl: url } });
  else if (tipo === "artefato")
    await prisma.artefato.update({ where: { id }, data: { imagemUrl: url } });
  else await prisma.capitulo.update({ where: { id }, data: { imagemUrl: url } });
}

export async function POST(req: Request) {
  try {
    const corpo = (await req.json().catch(() => null)) as
      | { tipo?: string; id?: string; dados?: string }
      | null;
    const tipo = corpo?.tipo as Tipo | undefined;
    const id = corpo?.id;
    const bruto = corpo?.dados;

    if (!tipo || !TIPOS.includes(tipo))
      return respostaErro("Tipo inválido.", 400);
    if (!id || !bruto)
      return respostaErro("Informe tipo, id e os dados Base64.", 400);

    // Aceita data URL ("data:image/png;base64,xxx") ou Base64 puro
    let mime = "image/png";
    let base64 = bruto.trim();
    const match = /^data:(image\/[a-z+]+);base64,(.*)$/i.exec(base64);
    if (match) {
      mime = match[1].toLowerCase();
      base64 = match[2];
    }
    const extensao = MIME_PARA_EXT[mime];
    if (!extensao)
      return respostaErro(
        "Formato não suportado. Use Base64 de JPG, PNG ou WebP.",
        400,
      );

    const buffer = Buffer.from(base64, "base64");
    if (buffer.length === 0)
      return respostaErro("Base64 inválido ou vazio.", 400);
    if (buffer.length > TAMANHO_MAX_BYTES)
      return respostaErro("Imagem muito grande. Máximo: 5 MB.", 400);

    if (tipo === "personagem") {
      if (!(await prisma.personagem.findUnique({ where: { id } })))
        return respostaErro("Registro não encontrado", 404);
    } else if (tipo === "ambiente") {
      if (!(await prisma.ambiente.findUnique({ where: { id } })))
        return respostaErro("Registro não encontrado", 404);
    } else if (tipo === "artefato") {
      if (!(await prisma.artefato.findUnique({ where: { id } })))
        return respostaErro("Registro não encontrado", 404);
    } else {
      if (!(await prisma.capitulo.findUnique({ where: { id } })))
        return respostaErro("Registro não encontrado", 404);
    }

    const nomeArquivo = `${id}-${Date.now()}.${extensao}`;
    const urlPublica = `/uploads/${tipo}/${nomeArquivo}`;
    const destino = path.join(process.cwd(), "public", "uploads", tipo, nomeArquivo);
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, buffer);

    await salvarImagemUrl(tipo, id, urlPublica);
    return Response.json({ imagemUrl: urlPublica });
  } catch {
    return respostaErro(
      "Não foi possível decodificar o Base64 informado. Verifique se é uma imagem válida.",
      400,
    );
  }
}
