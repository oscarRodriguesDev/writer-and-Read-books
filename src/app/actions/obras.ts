"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function excluirObra(obraId: string) {
  await prisma.obra.delete({ where: { id: obraId } });
  revalidatePath("/");
  return { success: true };
}

export async function arquivarObra(obraId: string) {
  await prisma.obra.update({
    where: { id: obraId },
    data: { arquivada: true },
  });
  revalidatePath("/");
  return { success: true };
}

export async function desarquivarObra(obraId: string) {
  await prisma.obra.update({
    where: { id: obraId },
    data: { arquivada: false },
  });
  revalidatePath("/");
  return { success: true };
}