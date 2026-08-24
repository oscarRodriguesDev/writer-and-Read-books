import { prisma } from "@/lib/db";
import { urlImagemSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

/**
 * POST /api/upload/url — define a imagem representativa por URL externa
 * (alternativa ao upload de arquivo; o banco guarda apenas o caminho/URL).
 */
export async function POST(req: Request) {
  try {
    const validacao = await validarCorpo(urlImagemSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const { tipo, id, url } = validacao.dados;

    if (tipo === "personagem") {
      const registro = await prisma.personagem.findUnique({ where: { id } });
      if (!registro) return respostaErro("Registro não encontrado", 404);
      await prisma.personagem.update({ where: { id }, data: { imagemUrl: url } });
    } else if (tipo === "ambiente") {
      const registro = await prisma.ambiente.findUnique({ where: { id } });
      if (!registro) return respostaErro("Registro não encontrado", 404);
      await prisma.ambiente.update({ where: { id }, data: { imagemUrl: url } });
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
