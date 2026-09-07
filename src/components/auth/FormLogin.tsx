"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/lib/validators/autenticacao";
import { inputCls, labelCls, btnPrimario } from "@/components/ui";

export default function FormLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const validacao = loginSchema.safeParse({ login, senha });
    if (!validacao.success) {
      setErro(validacao.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setCarregando(true);
    try {
      const resultado = await signIn("credentials", {
        redirect: false,
        login,
        senha,
      });
      if (resultado?.error) {
        setErro("Email/usuário ou senha incorretos.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErro("Falha ao entrar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <label htmlFor="login" className={labelCls}>
          Email ou nome de usuário
        </label>
        <input
          id="login"
          type="text"
          autoComplete="username"
          required
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          className={inputCls}
          placeholder="voce@email.com"
        />
      </div>

      <div>
        <label htmlFor="senha" className={labelCls}>
          Senha
        </label>
        <input
          id="senha"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className={inputCls}
          placeholder="••••••••"
        />
      </div>

      {erro && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}

      <button type="submit" disabled={carregando} className={`${btnPrimario} w-full`}>
        {carregando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}