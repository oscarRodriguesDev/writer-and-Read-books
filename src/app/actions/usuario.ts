"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import {
  atualizarPerfilSchema,
  atualizarContaSchema,
  atualizarSenhaSchema,
  excluirContaSchema,
  type AtualizarPerfilForm,
  type AtualizarContaInput,
  type AtualizarSenhaInput,
  type ExcluirContaInput,
} from "@/lib/validators/usuario";

type Resultado =
  | { success: true; aviso?: string }
  | { success: false; erro: string };

/** Usuário da sessão atual (id + registro completo sem a senha). */
async function usuarioDaSessao() {
  const sessao = await auth();
  const id = sessao?.user?.id;
  if (!id) return null;
  return prisma.usuario.findUnique({ where: { id } });
}

/** Envia só a mensagem ao usuário (sem vazar se a conta existe ou não). */
function naoAutenticado(): Resultado {
  return { success: false, erro: "Não autenticado." };
}

/** Atualiza dados não sensíveis do perfil (nome, idade, bio, gêneros…). */
export async function atualizarDadosPerfil(dados: AtualizarPerfilForm): Promise<Resultado> {
  const usuario = await usuarioDaSessao();
  if (!usuario) return naoAutenticado();

  const validacao = atualizarPerfilSchema.safeParse(dados);
  if (!validacao.success) {
    return { success: false, erro: validacao.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = validacao.data;
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      nome: d.nome,
      idade: d.idade ?? null,
      generosLiterarios: d.generosLiterarios,
      nomeAutor: d.nomeAutor ?? null,
      telefone: d.telefone ?? null,
      bio: d.bio ?? null,
      site: d.site ?? null,
    },
  });

  revalidatePath("/perfil");
  return { success: true };
}

/** Troca de email/username — exige a senha atual (RN-01). */
export async function atualizarDadosConta(dados: AtualizarContaInput): Promise<Resultado> {
  const usuario = await usuarioDaSessao();
  if (!usuario) return naoAutenticado();

  const validacao = atualizarContaSchema.safeParse(dados);
  if (!validacao.success) {
    return { success: false, erro: validacao.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = validacao.data;

  const senhaOk = await bcrypt.compare(d.senhaAtual, usuario.senhaHash);
  if (!senhaOk) return { success: false, erro: "Senha atual incorreta." };

  try {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        ...(d.email !== undefined ? { email: d.email } : {}),
        ...(d.username !== undefined ? { username: d.username } : {}),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { success: false, erro: "Email ou nome de usuário já cadastrado." };
    }
    throw e;
  }

  revalidatePath("/perfil");
  return {
    success: true,
    aviso:
      "Alterado com sucesso. O nome de usuário no menu pode continuar o antigo até o próximo login (sessão JWT).",
  };
}

/** Troca de senha — confirma a atual e grava o novo hash (custo 10). */
export async function atualizarSenha(dados: AtualizarSenhaInput): Promise<Resultado> {
  const usuario = await usuarioDaSessao();
  if (!usuario) return naoAutenticado();

  const validacao = atualizarSenhaSchema.safeParse(dados);
  if (!validacao.success) {
    return { success: false, erro: validacao.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = validacao.data;

  const senhaOk = await bcrypt.compare(d.senhaAtual, usuario.senhaHash);
  if (!senhaOk) return { success: false, erro: "Senha atual incorreta." };

  const senhaHash = await bcrypt.hash(d.novaSenha, 10);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash },
  });

  revalidatePath("/perfil");
  return { success: true };
}

/**
 * Exclusão definitiva da conta — confirma a senha atual e apaga o usuário.
 * As obras (e toda a cadeia: capítulos, cenas, personagens, análises…)
 * seguem via cascade (Obra.usuario onDelete: Cascade).
 */
export async function excluirConta(dados: ExcluirContaInput): Promise<Resultado> {
  const usuario = await usuarioDaSessao();
  if (!usuario) return naoAutenticado();

  const validacao = excluirContaSchema.safeParse(dados);
  if (!validacao.success) {
    return { success: false, erro: validacao.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = validacao.data;

  const senhaOk = await bcrypt.compare(d.senhaAtual, usuario.senhaHash);
  if (!senhaOk) return { success: false, erro: "Senha atual incorreta." };

  await prisma.usuario.delete({ where: { id: usuario.id } });

  revalidatePath("/");
  return { success: true };
}