import Link from "next/link";
import { FormObra } from "@/components/FormObra";
import { cardCls, btnSecundario } from "@/components/ui";

export const metadata = { title: "Nova Obra" };

export default function NovaObraPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Link href="/" className={`mb-6 inline-block ${btnSecundario}`}>
        ← Voltar
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Nova Obra</h1>
      <div className={cardCls}>
        <FormObra />
      </div>
    </main>
  );
}
