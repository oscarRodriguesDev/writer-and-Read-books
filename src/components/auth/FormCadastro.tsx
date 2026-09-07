"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { cadastroSchema } from "@/lib/validators/autenticacao";
import { inputCls, labelCls, btnPrimario } from "@/components/ui";
import { GENEROS_LITERARIOS } from "@/lib/constants";

const inputErroCls = "border-red-400 focus:border-red-400 focus:ring-red-200";

export default function FormCadastro() {
  const router = useRouter();

  const [form, setForm] = useState({
    nome: "",
    idade: "",
    generosLiterarios: [] as string[],
    nomeAutor: "",
    telefone: "",
    email: "",
    username: "",
    senha: "",
    confirmarSenha: "",
    bio: "",
    site: "",
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  function setCampo(campo: keyof typeof form, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function alternarGenero(genero: string) {
    setForm((f) => ({
      ...f,
      generosLiterarios: f.generosLiterarios.includes(genero)
        ? f.generosLiterarios.filter((g) => g !== genero)
        : [...f.generosLiterarios, genero],
    }));
  }

  function escolherFoto(arquivo: File | undefined) {
    if (!arquivo) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
      setErro("Foto de perfil: use JPG, PNG ou WebP.");
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      setErro("Foto de perfil: máximo 5 MB.");
      return;
    }
    setErro(null);
    setFoto(arquivo);
    setPreviewFoto(URL.createObjectURL(arquivo));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);

    if (form.senha !== form.confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    const validacao = cadastroSchema.safeParse({
      nome: form.nome,
      idade: form.idade,
      generosLiterarios: form.generosLiterarios,
      nomeAutor: form.nomeAutor,
      telefone: form.telefone,
      email: form.email,
      username: form.username,
      senha: form.senha,
      bio: form.bio,
      site: form.site,
    });
    if (!validacao.success) {
      setErro(validacao.error.issues[0]?.message ?? "Verifique os dados informados.");
      return;
    }

    setCarregando(true);
    try {
      const dados = validacao.data;
      const res = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const corpo = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(corpo.erro ?? "Não foi possível criar a conta.");
        return;
      }

      // Upload da foto de perfil (opcional) — não impede o cadastro se falhar
      const idUsuario = corpo.usuario?.id;
      if (foto && idUsuario) {
        const data = new FormData();
        data.append("tipo", "perfil");
        data.append("id", idUsuario);
        data.append("arquivo", foto);
        const resFoto = await fetch("/api/upload", { method: "POST", body: data });
        if (!resFoto.ok) {
          setAviso("Conta criada, mas a foto de perfil não pôde ser enviada. Você pode adicioná-la depois.");
        }
      }

      // Login automático e ida para a aplicação
      await signIn("credentials", {
        redirect: false,
        login: dados.email,
        senha: dados.senha,
      });
      router.push("/");
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      {/* Foto de perfil */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputFotoRef.current?.click()}
          className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-soft bg-surface text-2xl text-faint transition-colors hover:border-accent"
          aria-label="Escolher foto de perfil"
        >
          {previewFoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewFoto} alt="Prévia da foto de perfil" className="h-full w-full object-cover" />
          ) : (
            "📷"
          )}
        </button>
        <div className="flex-1">
          <p className="text-sm font-medium text-soft">Foto de perfil <span className="text-faint">(opcional)</span></p>
          <p className="text-xs text-muted">JPG, PNG ou WebP — até 5 MB</p>
          <input
            ref={inputFotoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => escolherFoto(e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nome" className={labelCls}>
            Nome *
          </label>
          <input
            id="nome"
            type="text"
            autoComplete="name"
            required
            value={form.nome}
            onChange={(e) => setCampo("nome", e.target.value)}
            className={inputCls}
            placeholder="Seu nome completo"
          />
        </div>

        <div>
          <label htmlFor="idade" className={labelCls}>
            Idade <span className="text-faint">(opcional)</span>
          </label>
          <input
            id="idade"
            type="number"
            inputMode="numeric"
            min={13}
            max={120}
            value={form.idade}
            onChange={(e) => setCampo("idade", e.target.value)}
            className={inputCls}
            placeholder="Ex.: 25"
          />
        </div>

        <div>
          <label htmlFor="username" className={labelCls}>
            Nome de usuário *
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            value={form.username}
            onChange={(e) => setCampo("username", e.target.value)}
            className={inputCls}
            placeholder="ex.: escritor_br (letras, números, _)"
          />
        </div>

        <div>
          <label htmlFor="nomeAutor" className={labelCls}>
            Nome de autor <span className="text-faint">(opcional)</span>
          </label>
          <input
            id="nomeAutor"
            type="text"
            value={form.nomeAutor}
            onChange={(e) => setCampo("nomeAutor", e.target.value)}
            className={inputCls}
            placeholder="Pseudônimo para publicar"
          />
        </div>

        <div>
          <label htmlFor="email" className={labelCls}>
            Email *
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setCampo("email", e.target.value)}
            className={inputCls}
            placeholder="voce@email.com"
          />
        </div>

        <div>
          <label htmlFor="telefone" className={labelCls}>
            Telefone <span className="text-faint">(opcional)</span>
          </label>
          <input
            id="telefone"
            type="tel"
            autoComplete="tel"
            value={form.telefone}
            onChange={(e) => setCampo("telefone", e.target.value)}
            className={inputCls}
            placeholder="(11) 91234-5678"
          />
        </div>

        <div>
          <label htmlFor="senha" className={labelCls}>
            Senha *
          </label>
          <input
            id="senha"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.senha}
            onChange={(e) => setCampo("senha", e.target.value)}
            className={inputCls}
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label htmlFor="confirmarSenha" className={labelCls}>
            Confirmar senha *
          </label>
          <input
            id="confirmarSenha"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirmarSenha}
            onChange={(e) => setCampo("confirmarSenha", e.target.value)}
            className={inputCls}
            placeholder="Digite a senha novamente"
          />
        </div>
      </div>

      {/* Gêneros literários */}
      <fieldset>
        <legend className={labelCls}>
          Gêneros literários que você escreve <span className="text-faint">(opcional)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {GENEROS_LITERARIOS.map((genero) => {
            const selecionado = form.generosLiterarios.includes(genero);
            return (
              <button
                key={genero}
                type="button"
                aria-pressed={selecionado}
                onClick={() => alternarGenero(genero)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selecionado
                    ? "border-accent bg-accent text-onaccent"
                    : "border-line bg-surface text-muted hover:border-accent/40 hover:text-foreground"
                }`}
              >
                {genero}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="bio" className={labelCls}>
            Bio <span className="text-faint">(opcional)</span>
          </label>
          <textarea
            id="bio"
            rows={3}
            maxLength={500}
            value={form.bio}
            onChange={(e) => setCampo("bio", e.target.value)}
            className={`${inputCls} resize-y`}
            placeholder="Um pouco sobre você como escritor(a)…"
          />
        </div>

        <div>
          <label htmlFor="site" className={labelCls}>
            Site ou redes sociais <span className="text-faint">(opcional)</span>
          </label>
          <input
            id="site"
            type="url"
            value={form.site}
            onChange={(e) => setCampo("site", e.target.value)}
            className={inputCls}
            placeholder="https://…"
          />
        </div>
      </div>

      {erro && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}
      {aviso && (
        <p role="status" className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
          {aviso}
        </p>
      )}

      <button type="submit" disabled={carregando} className={`${btnPrimario} w-full`}>
        {carregando ? "Criando conta…" : "Criar conta"}
      </button>
    </form>
  );
}