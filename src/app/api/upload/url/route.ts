import { prisma } from "@/lib/db";
import { urlImagemSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

/**
 * POST /api/upload/url — define a imagem representativa por URL externa
 * (alternativa ao upload de arquivo; o banco guarda apenas o caminho/URL).
 * Valida que a URL realmente serve uma imagem (evita salvar páginas HTML,
 * como links de compartilhamento do Gemini/Drive).
 */
async function verificarImagem(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "image/*" },
    });
    const tipo = res.headers.get("content-type") ?? "";
    return res.ok && tipo.startsWith("image/") ? tipo : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const validacao = await validarCorpo(urlImagemSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const { tipo, id, url } = validacao.dados;

    // A URL precisa apontar para um ARQUIVO de imagem, não para uma página
    if (!(await verificarImagem(url)))
      return respostaErro(
        "Esta URL não retorna uma imagem direta (parece ser uma página). Abra o link, clique com o botão direito na imagem e escolha “Copiar endereço da imagem”, ou baixe o arquivo e use o upload.",
        400,
      );

    if (tipo === "personagem") {
      const registro = await prisma.personagem.findUnique({ where: { id } });
      if (!registro) return respostaErro("Registro não encontrado", 404);
      await prisma.personagem.update({ where: { id }, data: { imagemUrl: url } });
    } else if (tipo === "ambiente") {
      const registro = await prisma.ambiente.findUnique({ where: { id } });
      if (!registro) return respostaErro("Registro não encontrado", 404);
      await prisma.ambiente.update({ where: { id }, data: { imagemUrl: url } });
    } else if (tipo === "artefato") {
      const registro = await prisma.artefato.findUnique({ where: { id } });
      if (!registro) return respostaErro("Registro não encontrado", 404);
      await prisma.artefato.update({ where: { id }, data: { imagemUrl: url } });
    } else {
      const registro = await prisma.capitulo.findUnique({ where: { id } });
      if (!registro) return respostaErro("Registro não encontrado", 404);
      await prisma.capitulo.update({ where: { id }, data: { imagemUrl: url } });
    }

    return Response.json({ imagemUrl: url });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
