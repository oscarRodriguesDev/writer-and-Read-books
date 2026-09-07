import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import FormLogin from "@/components/auth/FormLogin";
import { GRAFIC } from "@/lib/grafic";

export const metadata: Metadata = {
  title: "Entrar — Book Writer & Reader",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line fundo-papel p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={GRAFIC.mascoteEscritor}
            alt=""
            aria-hidden="true"
            className="h-16 w-16 rounded-full object-cover"
          />
          <h1 className="mt-3 text-2xl font-bold">Book Writer & Reader</h1>
          <p className="mt-1 text-sm text-muted">Entre para continuar suas obras</p>
        </div>

        <Suspense
          fallback={<p className="py-10 text-center text-sm text-muted">Carregando…</p>}
        >
          <FormLogin />
        </Suspense>

        <p className="mt-6 text-center text-sm text-muted">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-accent hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}