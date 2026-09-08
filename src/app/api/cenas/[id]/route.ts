import { prisma } from "@/lib/db";
import { cenaPatchSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterCenaDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ id: string }> };

/** GET — retorna a cena com personagens e ambientes associados. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const cena = await obterCenaDoUsuario(id, {
      personagens: { include: { personagem: true } },
      ambientes: { include: { ambiente: true } },
    });
    if (!cena) return respostaErro("Cena não encontrada", 404);
    return Response.json(cena);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const existente = await obterCenaDoUsuario(id);
    if (!existente) return respostaErro("Cena não encontrada", 404);

    const validacao = await validarCorpo(cenaPatchSchema, req);
    if (!validacao.ok) return validacao.resposta;

    // Remove chaves não enviadas (undefined) para não sobrescrever com null
    const dados = Object.fromEntries(
      Object.entries(validacao.dados).filter(([, v]) => v !== undefined),
    );

    const cena = await prisma.cena.update({ where: { id }, data: dados });
    return Response.json(cena);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

/**
 * DELETE — remove a cena e renumera as cenas restantes da mesma parte
 * (ordens contíguas 1..N).
 */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const cena = await obterCenaDoUsuario(id);
    if (!cena) return respostaErro("Cena não encontrada", 404);

    await prisma.$transaction(async (tx) => {
      await tx.cena.delete({ where: { id } });
      const irmaos = await tx.cena.findMany({
        where: { parteId: cena.parteId },
        orderBy: { ordem: "asc" },
        select: { id: true },
      });
      for (const [i, irmao] of irmaos.entries()) {
        await tx.cena.update({
          where: { id: irmao.id },
          data: { ordem: i + 1 },
        });
      }
    });

    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
