import Link from "next/link";
import { FormObra } from "@/components/FormObra";
import { cardCls, btnSecundario } from "@/components/ui";
import { buscarUsuarioAtual } from "@/lib/usuario-atual";

export const metadata = { title: "Nova Obra" };

export default async function NovaObraPage() {
  const usuario = await buscarUsuarioAtual();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link href="/" className={`mb-6 inline-block ${btnSecundario}`}>
        ← Voltar
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Nova Obra</h1>
      <div className={cardCls}>
        <FormObra autor={usuario?.nomeAutor ?? usuario?.nome} />
      </div>
    </main>
  );
}