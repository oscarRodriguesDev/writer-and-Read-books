"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cardCls, inputCls, labelCls, btnPrimario, btnGhost } from "@/components/ui";
import { GENEROS_LITERARIOS } from "@/lib/constants";
import type { PerfilDados } from "@/lib/perfil";
import {
  atualizarDadosPerfil,
  atualizarDadosConta,
  atualizarSenha,
} from "@/app/actions/usuario";
import AvatarPerfil from "./AvatarPerfil";

type Notificacao = { texto: string; tipo: "erro" | "sucesso" | "aviso" } | null;

const chipCls = (selecionado: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm transition-colors ${
    selecionado
      ? "border-accent bg-accent text-onaccent"
      : "border-line bg-surface text-muted hover:border-accent/40 hover:text-foreground"
  }`;

function CampoLeitura({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-faint">{rotulo}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{valor}</dd>
    </div>
  );
}

function Mensagem({ notificacao }: { notificacao: Notificacao }) {
  if (!notificacao) return null;
  const estilos = {
    erro: "border-red-200 bg-red-50 text-red-700",
    sucesso: "border-emerald-200 bg-emerald-50 text-emerald-700",
    aviso: "border-yellow-200 bg-yellow-50 text-yellow-700",
  } as const;
  return (
    <p
      role={notificacao.tipo === "erro" ? "alert" : "status"}
      className={`rounded-md border px-3 py-2 text-sm ${estilos[notificacao.tipo]}`}
    >
      {notificacao.texto}
    </p>
  );
}

export default function PaginaPerfil({
  usuario,
  totalObras,
}: {
  usuario: PerfilDados;
  totalObras: number;
}) {
  const router = useRouter();
  const [notificacao, setNotificacao] = useState<Notificacao>(null);

  function notificar(texto: string, tipo: "erro" | "sucesso" | "aviso" = "aviso") {
    setNotificacao({ texto, tipo });
  }

  const membroDesde = new Date(usuario.criadoEm).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <Mensagem notificacao={notificacao} />

      {/* Cabeçalho */}
      <section className={`${cardCls} flex flex-col items-center gap-5 sm:flex-row sm:items-start`}>
        <AvatarPerfil
          usuarioId={usuario.id}
          fotoUrl={usuario.fotoUrl}
          nome={usuario.nome}
          onNotificar={notificar}
        />
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-foreground">{usuario.nome}</h1>
          <p className="text-muted">@{usuario.username}</p>
          {usuario.nomeAutor && (
            <p className="mt-1 inline-block rounded-full bg-chipbg px-3 py-1 text-sm text-soft">
              🖋️ escreve como <span className="font-medium text-foreground">{usuario.nomeAutor}</span>
            </p>
          )}
          {usuario.bio && <p className="mt-2 max-w-xl text-sm text-soft">{usuario.bio}</p>}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-faint sm:justify-start">
            <span>Membro desde {membroDesde}</span>
            <span aria-hidden="true">·</span>
            <span>
              {totalObras} {totalObras === 1 ? "obra" : "obras"}
            </span>
            {usuario.site && (
              <>
                <span aria-hidden="true">·</span>
                <a
                  href={usuario.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {usuario.site.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      <BlocoPerfil usuario={usuario} onNotificar={notificar} />
      <BlocoConta usuario={usuario} onNotificar={notificar} />
      <BlocoSeguranca onNotificar={notificar} />
    </div>
  );
}

/* ================= Bloco Perfil (dados não sensíveis) ================= */

function BlocoPerfil({
  usuario,
  onNotificar,
}: {
  usuario: PerfilDados;
  onNotificar: (texto: string, tipo?: "erro" | "sucesso" | "aviso") => void;
}) {
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: usuario.nome,
    idade: usuario.idade !== null ? String(usuario.idade) : "",
    nomeAutor: usuario.nomeAutor ?? "",
    telefone: usuario.telefone ?? "",
    bio: usuario.bio ?? "",
    site: usuario.site ?? "",
    generos: usuario.generosLiterarios,
  });

  function setCampo(campo: keyof typeof form, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function alternarGenero(genero: string) {
    setForm((f) => ({
      ...f,
      generos: f.generos.includes(genero)
        ? f.generos.filter((g) => g !== genero)
        : [...f.generos, genero],
    }));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const resultado = await atualizarDadosPerfil({
        nome: form.nome,
        idade: form.idade,
        generosLiterarios: form.generos,
        nomeAutor: form.nomeAutor,
        telefone: form.telefone,
        bio: form.bio,
        site: form.site,
      });
      if (!resultado.success) {
        onNotificar(resultado.erro, "erro");
        return;
      }
      onNotificar("Perfil atualizado com sucesso!", "sucesso");
      setEditando(false);
      router.refresh();
    } catch {
      onNotificar("Falha de conexão. Tente novamente.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  const router = useRouter();

  return (
    <section className={cardCls}>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Perfil</h2>
        {editando ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setForm({
                  nome: usuario.nome,
                  idade: usuario.idade !== null ? String(usuario.idade) : "",
                  nomeAutor: usuario.nomeAutor ?? "",
                  telefone: usuario.telefone ?? "",
                  bio: usuario.bio ?? "",
                  site: usuario.site ?? "",
                  generos: usuario.generosLiterarios,
                });
                setEditando(false);
              }}
              className={btnGhost}
            >
              Cancelar
            </button>
            <button type="button" onClick={salvar} disabled={salvando} className={btnPrimario}>
              {salvando ? "Salvando…" : "Salvar"}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setEditando(true)} className={btnGhost}>
            ✏️ Editar
          </button>
        )}
      </header>

      {editando ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Nome *</label>
              <input type="text" value={form.nome} onChange={(e) => setCampo("nome", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Idade <span className="text-faint">(opcional)</span></label>
              <input
                type="number"
                inputMode="numeric"
                min={13}
                max={120}
                value={form.idade}
                onChange={(e) => setCampo("idade", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Nome de autor <span className="text-faint">(opcional)</span></label>
              <input
                type="text"
                value={form.nomeAutor}
                onChange={(e) => setCampo("nomeAutor", e.target.value)}
                className={inputCls}
                placeholder="Pseudônimo para publicar"
              />
            </div>
            <div>
              <label className={labelCls}>Telefone <span className="text-faint">(opcional)</span></label>
              <input
                type="tel"
                autoComplete="tel"
                value={form.telefone}
                onChange={(e) => setCampo("telefone", e.target.value)}
                className={inputCls}
                placeholder="(11) 91234-5678"
              />
            </div>
          </div>

          <fieldset>
            <legend className={labelCls}>Gêneros literários <span className="text-faint">(opcional)</span></legend>
            <div className="flex flex-wrap gap-2">
              {GENEROS_LITERARIOS.map((genero) => (
                <button
                  key={genero}
                  type="button"
                  aria-pressed={form.generos.includes(genero)}
                  onClick={() => alternarGenero(genero)}
                  className={chipCls(form.generos.includes(genero))}
                >
                  {genero}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label className={labelCls}>Bio <span className="text-faint">(opcional)</span></label>
            <textarea
              rows={3}
              maxLength={500}
              value={form.bio}
              onChange={(e) => setCampo("bio", e.target.value)}
              className={`${inputCls} resize-y`}
            />
          </div>
          <div>
            <label className={labelCls}>Site ou redes sociais <span className="text-faint">(opcional)</span></label>
            <input
              type="url"
              value={form.site}
              onChange={(e) => setCampo("site", e.target.value)}
              className={inputCls}
              placeholder="https://…"
            />
          </div>
        </div>
      ) : (
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoLeitura rotulo="Nome" valor={usuario.nome} />
          <CampoLeitura rotulo="Idade" valor={usuario.idade !== null ? `${usuario.idade} anos` : "Não informada"} />
          <CampoLeitura
            rotulo="Nome de autor"
            valor={usuario.nomeAutor ? `🖋️ ${usuario.nomeAutor}` : "Não informado"}
          />
          <CampoLeitura rotulo="Telefone" valor={usuario.telefone ?? "Não informado"} />
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-faint">Gêneros literários</dt>
            <dd className="mt-1.5">
              {usuario.generosLiterarios.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {usuario.generosLiterarios.map((g) => (
                    <span key={g} className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
                      {g}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-faint">Não informado</span>
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <CampoLeitura rotulo="Bio" valor={usuario.bio ?? "Vazio"} />
          </div>
        </dl>
      )}
    </section>
  );
}

/* ================= Bloco Conta (email/username — exige senha) ================= */

function BlocoConta({
  usuario,
  onNotificar,
}: {
  usuario: PerfilDados;
  onNotificar: (texto: string, tipo?: "erro" | "sucesso" | "aviso") => void;
}) {
  const router = useRouter();
  const inicial = { email: usuario.email, username: usuario.username, senhaAtual: "" };
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(inicial);

  async function salvar() {
    const alteracoes: { email?: string; username?: string } = {};
    if (form.email !== usuario.email) alteracoes.email = form.email;
    if (form.username !== usuario.username) alteracoes.username = form.username;

    if (Object.keys(alteracoes).length === 0) {
      onNotificar("Nenhuma alteração para salvar.", "aviso");
      return;
    }

    setSalvando(true);
    try {
      const resultado = await atualizarDadosConta({ ...alteracoes, senhaAtual: form.senhaAtual });
      if (!resultado.success) {
        onNotificar(resultado.erro, "erro");
        return;
      }
      onNotificar("Conta atualizada!", "sucesso");
      if (resultado.aviso) onNotificar(resultado.aviso, "aviso");
      setEditando(false);
      setForm({ ...inicial, email: alteracoes.email ?? usuario.email, username: alteracoes.username ?? usuario.username });
      router.refresh();
    } catch {
      onNotificar("Falha de conexão. Tente novamente.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className={cardCls}>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Conta</h2>
        {editando ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setForm(inicial);
                setEditando(false);
              }}
              className={btnGhost}
            >
              Cancelar
            </button>
            <button type="button" onClick={salvar} disabled={salvando} className={btnPrimario}>
              {salvando ? "Salvando…" : "Salvar"}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setEditando(true)} className={btnGhost}>
            ✏️ Editar
          </button>
        )}
      </header>

      {editando ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Nome de usuário</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Senha atual *</label>
            <input
              type="password"
              autoComplete="current-password"
              value={form.senhaAtual}
              onChange={(e) => setForm((f) => ({ ...f, senhaAtual: e.target.value }))}
              className={inputCls}
              placeholder="Necessária para confirmar a alteração"
            />
          </div>
          <p className="text-xs text-muted">
            Username aceita letras, números e underline — sem espaços. O nome de usuário no menu pode continuar o
            antigo até o próximo login.
          </p>
        </div>
      ) : (
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoLeitura rotulo="Nome de usuário" valor={`@${usuario.username}`} />
          <CampoLeitura rotulo="Email" valor={usuario.email} />
        </dl>
      )}
    </section>
  );
}

/* ================= Bloco Segurança (troca de senha) ================= */

function BlocoSeguranca({
  onNotificar,
}: {
  onNotificar: (texto: string, tipo?: "erro" | "sucesso" | "aviso") => void;
}) {
  const [form, setForm] = useState({ senhaAtual: "", novaSenha: "", confirmarNovaSenha: "" });
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    try {
      const resultado = await atualizarSenha(form);
      if (!resultado.success) {
        onNotificar(resultado.erro, "erro");
        return;
      }
      onNotificar("Senha alterada com sucesso!", "sucesso");
      setForm({ senhaAtual: "", novaSenha: "", confirmarNovaSenha: "" });
    } catch {
      onNotificar("Falha de conexão. Tente novamente.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className={cardCls}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
        <p className="text-sm text-muted">Trocar a senha da sua conta.</p>
      </header>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Senha atual *</label>
            <input
              type="password"
              autoComplete="current-password"
              value={form.senhaAtual}
              onChange={(e) => setForm((f) => ({ ...f, senhaAtual: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Nova senha *</label>
            <input
              type="password"
              autoComplete="new-password"
              value={form.novaSenha}
              onChange={(e) => setForm((f) => ({ ...f, novaSenha: e.target.value }))}
              className={inputCls}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className={labelCls}>Confirmar nova senha *</label>
            <input
              type="password"
              autoComplete="new-password"
              value={form.confirmarNovaSenha}
              onChange={(e) => setForm((f) => ({ ...f, confirmarNovaSenha: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>
        <button type="button" onClick={salvar} disabled={salvando} className={btnPrimario}>
          {salvando ? "Alterando…" : "Alterar senha"}
        </button>
        <p className="text-xs text-muted">
          Você continua logado após trocar a senha neste dispositivo; outras sessões caem quando o token expirar.
        </p>
      </div>
    </section>
  );
}