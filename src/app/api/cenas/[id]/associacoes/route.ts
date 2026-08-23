import { prisma } from "@/lib/db";
import { associacoesCenaSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

/** PUT — substitui as associações de personagens e ambientes da cena. */
export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const cena = await prisma.cena.findUnique({
      where: { id },
      include: { parte: { include: { capitulo: true } } },
    });
    if (!cena) return respostaErro("Cena não encontrada", 404);
    const obraId = cena.parte.capitulo.obraId;

    const validacao = await validarCorpo(associacoesCenaSchema, req);
    if (!validacao.ok) return validacao.resposta;

    // Remove duplicatas antes de validar e gravar
    const personagensIds = [...new Set(validacao.dados.personagensIds)];
    const ambientesIds = [...new Set(validacao.dados.ambientesIds)];

    const [totalPersonagens, totalAmbientes] = await Promise.all([
      prisma.personagem.count({ where: { obraId, id: { in: personagensIds } } }),
      prisma.ambiente.count({ where: { obraId, id: { in: ambientesIds } } }),
    ]);

    if (totalPersonagens !== personagensIds.length)
      return respostaErro("Um ou mais personagens não pertencem a esta obra", 400);
    if (totalAmbientes !== ambientesIds.length)
      return respostaErro("Um ou mais ambientes não pertencem a esta obra", 400);

    await prisma.$transaction([
      prisma.cenaPersonagem.deleteMany({ where: { cenaId: id } }),
      prisma.cenaAmbiente.deleteMany({ where: { cenaId: id } }),
      ...(personagensIds.length
        ? [
            prisma.cenaPersonagem.createMany({
              data: personagensIds.map((personagemId) => ({ cenaId: id, personagemId })),
            }),
          ]
        : []),
      ...(ambientesIds.length
        ? [
            prisma.cenaAmbiente.createMany({
              data: ambientesIds.map((ambienteId) => ({ cenaId: id, ambienteId })),
            }),
          ]
        : []),
    ]);

    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
