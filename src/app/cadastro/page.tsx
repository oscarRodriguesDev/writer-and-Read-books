import type { Metadata } from "next";
import Link from "next/link";
import FormCadastro from "@/components/auth/FormCadastro";
import { GRAFIC } from "@/lib/grafic";

export const metadata: Metadata = {
  title: "Criar conta — Book Writer & Reader",
};

export default function CadastroPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-line fundo-papel p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={GRAFIC.mascoteEscritor}
            alt=""
            aria-hidden="true"
            className="h-16 w-16 rounded-full object-cover"
          />
          <h1 className="mt-3 text-2xl font-bold">Criar conta</h1>
          <p className="mt-1 text-sm text-muted">
            Cadastre-se para escrever e estruturar suas obras
          </p>
        </div>

        <FormCadastro />

        <p className="mt-6 text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}