import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import PaginaPerfil from "@/components/perfil/PaginaPerfil";
import type { PerfilDados } from "@/lib/perfil";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const sessao = await auth();
  const usuarioId = sessao?.user?.id;
  if (!usuarioId) redirect("/login");

  const [usuario, totalObras] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        idade: true,
        generosLiterarios: true,
        nomeAutor: true,
        fotoUrl: true,
        username: true,
        email: true,
        telefone: true,
        bio: true,
        site: true,
        criadoEm: true,
      },
    }),
    prisma.obra.count({ where: { usuarioId } }),
  ]);
  if (!usuario) redirect("/login");

  const dados: PerfilDados = {
    ...usuario,
    generosLiterarios: Array.isArray(usuario.generosLiterarios)
      ? (usuario.generosLiterarios as string[])
      : [],
    criadoEm: usuario.criadoEm.toISOString(),
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <PaginaPerfil usuario={dados} totalObras={totalObras} />
    </main>
  );
}