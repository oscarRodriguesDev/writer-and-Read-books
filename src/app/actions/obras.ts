"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { obterObraDoUsuario } from "@/lib/auth-obras";

/** Retorna true se a obra pertence ao usuário logado (e existe). */
async function obraPermitida(obraId: string): Promise<boolean> {
  const obra = await obterObraDoUsuario(obraId);
  return obra !== null;
}

export async function excluirObra(obraId: string) {
  if (!(await obraPermitida(obraId))) {
    return { success: false, erro: "Obra não encontrada" };
  }
  await prisma.obra.delete({ where: { id: obraId } });
  revalidatePath("/");
  return { success: true };
}

export async function arquivarObra(obraId: string) {
  if (!(await obraPermitida(obraId))) {
    return { success: false, erro: "Obra não encontrada" };
  }
  await prisma.obra.update({
    where: { id: obraId },
    data: { arquivada: true },
  });
  revalidatePath("/");
  return { success: true };
}

export async function desarquivarObra(obraId: string) {
  if (!(await obraPermitida(obraId))) {
    return { success: false, erro: "Obra não encontrada" };
  }
  await prisma.obra.update({
    where: { id: obraId },
    data: { arquivada: false },
  });
  revalidatePath("/");
  return { success: true };
}