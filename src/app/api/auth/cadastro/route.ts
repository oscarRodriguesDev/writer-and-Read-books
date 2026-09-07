import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { cadastroSchema } from "@/lib/validators/autenticacao";
import {
  respostaErro,
  tratarErroDesconhecido,
  validarCorpo,
} from "@/lib/api-helpers";
import { Prisma } from "@/generated/prisma/client";

/** POST /api/auth/cadastro — cria a conta do usuário. */
export async function POST(req: Request) {
  try {
    const validacao = await validarCorpo(cadastroSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const dados = validacao.dados;
    // username/email já chegam normalizados (lowercase) pelo Zod
    const senhaHash = await bcrypt.hash(dados.senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome: dados.nome,
        idade: dados.idade ?? null,
        generosLiterarios: dados.generosLiterarios,
        nomeAutor: dados.nomeAutor ?? null,
        fotoUrl: dados.fotoUrl ?? null,
        username: dados.username,
        senhaHash,
        email: dados.email,
        telefone: dados.telefone ?? null,
        bio: dados.bio ?? null,
        site: dados.site ?? null,
      },
      select: { id: true, username: true, email: true },
    });

    return Response.json({ ok: true, usuario }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return respostaErro("Email ou nome de usuário já cadastrado.", 409);
    }
    return tratarErroDesconhecido(e);
  }
}