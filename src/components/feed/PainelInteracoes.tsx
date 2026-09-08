"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimario, btnSecundario } from "@/components/ui";
import { ROTULO_STATUS_SUGESTAO, STATUS_SUGESTAO } from "@/lib/constants";

export type AutorInfo = {
  id: string;
  nome: string;
  nomeAutor: string | null;
  fotoUrl: string | null;
  username: string | null;
};

export type ComentarioDTO = {
  id: string;
  conteudo: string;
  criadoEm: string;
  usuario: AutorInfo;
  respostas?: ComentarioDTO[];
};

type Props = {
  obraId: string;
  dono: boolean;
  logado: boolean;
  usuarioId: string | null;
  curtiuInicial: boolean;
  totalCurtidasInicial: number;
  comentariosInicial: ComentarioDTO[];
};

function nomeExibicao(u: AutorInfo): string {
  return u.nomeAutor ?? u.nome ?? u.username ?? "Leitor";
}

function Avatar({ usuario, tamanho = "h-8 w-8" }: { usuario: AutorInfo; tamanho?: string }) {
  if (usuario.fotoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={usuario.fotoUrl}
        alt={nomeExibicao(usuario)}
        className={`${tamanho} flex-shrink-0 rounded-full object-cover`}
      />
    );
  }
  const inicial = nomeExibicao(usuario).trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={`${tamanho} flex flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent`}
    >
      {inicial}
    </span>
  );
}

function ItemComentario({
  comentario,
  dono,
  logado,
  usuarioId,
  obraId,
}: {
  comentario: ComentarioDTO;
  dono: boolean;
  logado: boolean;
  usuarioId: string | null;
  obraId: string;
}) {
  const router = useRouter();
  const [respondendo, setRespondendo] = useState(false);
  const [resposta, setResposta] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Pode excluir: autor do comentário ou dono da obra
  const podeExcluir = logado && (dono || comentario.usuario.id === usuarioId);

  async function enviarResposta() {
    if (!resposta.trim()) return;
    setErro(null);
    try {
      const res = await fetch(`/api/feed/${obraId}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: resposta.trim(), comentarioPaiId: comentario.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.erro ?? "Erro ao responder");
      }
      setResposta("");
      setRespondendo(false);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    }
  }

  async function excluir() {
    if (!confirm("Excluir este comentário?")) return;
    setExcluindo(true);
    setErro(null);
    try {
      const res = await fetch(`/api/feed/${obraId}/comentarios/${comentario.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.erro ?? "Erro ao excluir");
      }
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
      setExcluindo(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="flex items-start gap-2.5">
        <Avatar usuario={comentario.usuario} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{nomeExibicao(comentario.usuario)}</span>
            <span className="text-xs text-faint">
              {new Date(comentario.criadoEm).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="ml-auto text-xs">
              {logado && (
                <button
                  type="button"
                  onClick={() => setRespondendo((v) => !v)}
                  className="text-accent hover:underline"
                >
                  Responder
                </button>
              )}
              {podeExcluir && (
                <button
                  type="button"
                  onClick={excluir}
                  disabled={excluindo}
                  className="ml-2 text-xs text-danger hover:underline disabled:opacity-50"
                >
                  Excluir
                </button>
              )}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-soft">
            {comentario.conteudo}
          </p>
          {erro && <p className="mt-1 text-xs text-danger">{erro}</p>}
        </div>
      </div>

      {respondendo && (
        <div className="mt-2 pl-10">
          <textarea
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            rows={2}
            maxLength={5000}
            placeholder="Escreva sua resposta…"
            className="w-full rounded-lg border border-inputline bg-surface px-3 py-2 text-sm text-foreground placeholder:text-faint focus:border-accent focus:outline-none"
          />
          <div className="mt-1.5 flex gap-2">
            <button type="button" onClick={enviarResposta} className={btnPrimario + " px-3 py-1.5 text-xs"}>
              Responder
            </button>
            <button type="button" onClick={() => setRespondendo(false)} className={btnSecundario + " px-3 py-1.5 text-xs"}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {comentario.respostas && comentario.respostas.length > 0 && (
        <div className="mt-3 space-y-2 pl-5">
          {comentario.respostas.map((r) => (
            <ItemComentario key={r.id} comentario={r} dono={dono} logado={logado} usuarioId={usuarioId} obraId={obraId} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Painel de interações da obra pública: curtir, comentários em thread e
 * sugestões ao autor (visíveis só para ele).
 */
export function PainelInteracoes({
  obraId,
  dono,
  logado,
  usuarioId,
  curtiuInicial,
  totalCurtidasInicial,
  comentariosInicial,
}: Props) {
  const router = useRouter();
  const [abacom, setAbacom] = useState<"comentarios" | "sugestoes">("comentarios");
  const [curtiu, setCurtiu] = useState(curtiuInicial);
  const [totalCurtidas, setTotalCurtidas] = useState(totalCurtidasInicial);
  const [curtindo, setCurtindo] = useState(false);
  const [novoComentario, setNovoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [erroComentario, setErroComentario] = useState<string | null>(null);
  // Sugestões: só o dono vê as de todos; leitor vê as próprias (via API)
  const [sugestoes, setSugestoes] = useState<
    Array<{ id: string; conteudo: string; status: string; criadoEm: string; usuario: AutorInfo }>
  >([]);
  const [sugestoesCarregadas, setSugestoesCarregadas] = useState(false);
  const [novaSugestao, setNovaSugestao] = useState("");
  const [enviandoSugestao, setEnviandoSugestao] = useState(false);
  const [erroSugestao, setErroSugestao] = useState<string | null>(null);

  const carregarSugestoes = useCallback(async () => {
    const res = await fetch(`/api/feed/${obraId}/sugestoes`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setSugestoes(json.sugestoes ?? []);
    }
    setSugestoesCarregadas(true);
  }, [obraId]);

  useEffect(() => {
    if (logado && abacom === "sugestoes" && !sugestoesCarregadas) {
      carregarSugestoes();
    }
  }, [logado, abacom, sugestoesCarregadas, carregarSugestoes]);

  async function alternarCurtida() {
    if (!logado) {
      router.push("/login");
      return;
    }
    setCurtindo(true);
    const otimista = !curtiu;
    setCurtiu(otimista);
    setTotalCurtidas((t) => Math.max(0, t + (otimista ? 1 : -1)));
    try {
      const res = await fetch(`/api/feed/${obraId}/curtir`, { method: "POST" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setCurtiu(json.curtido);
      setTotalCurtidas(json.total);
      router.refresh();
    } catch {
      setCurtiu(!otimista);
      setTotalCurtidas((t) => Math.max(0, t - (otimista ? 1 : -1)));
    } finally {
      setCurtindo(false);
    }
  }

  async function enviarComentario() {
    if (!novoComentario.trim()) return;
    setEnviandoComentario(true);
    setErroComentario(null);
    try {
      const res = await fetch(`/api/feed/${obraId}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: novoComentario.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.erro ?? "Erro ao comentar");
      }
      setNovoComentario("");
      router.refresh();
    } catch (e) {
      setErroComentario(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setEnviandoComentario(false);
    }
  }

  async function enviarSugestao() {
    if (!novaSugestao.trim()) return;
    setEnviandoSugestao(true);
    setErroSugestao(null);
    try {
      const res = await fetch(`/api/feed/${obraId}/sugestoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: novaSugestao.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.erro ?? "Erro ao enviar sugestão");
      }
      setNovaSugestao("");
      carregarSugestoes();
    } catch (e) {
      setErroSugestao(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setEnviandoSugestao(false);
    }
  }

  async function mudarStatusSugestao(id: string, status: string) {
    try {
      await fetch(`/api/feed/${obraId}/sugestoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      carregarSugestoes();
    } catch {
      // silencioso: mantém o estado atual
    }
  }

  return (
    <section className="mx-auto mt-10 w-full max-w-3xl">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line fundo-papel p-4 shadow-sm">
        {/* Curtir */}
        <button
          type="button"
          onClick={alternarCurtida}
          disabled={curtindo}
          aria-pressed={curtiu}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-fast disabled:opacity-50 ${
            curtiu
              ? "bg-accent text-onaccent"
              : "border border-inputline bg-surface text-foreground hover:bg-hoverbg"
          }`}
        >
          <span aria-hidden="true">{curtiu ? "❤️" : "🤍"}</span>
          {totalCurtidas.toLocaleString("pt-BR")}
          {curtiu ? " curtida(s)" : " curtir"}
        </button>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => setAbacom("comentarios")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              abacom === "comentarios" ? "bg-accent text-onaccent" : "text-muted hover:text-foreground"
            }`}
          >
            💬 Comentários
            {comentariosInicial.length > 0 && ` (${comentariosInicial.length})`}
          </button>
          <button
            type="button"
            onClick={() => setAbacom("sugestoes")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              abacom === "sugestoes" ? "bg-accent text-onaccent" : "text-muted hover:text-foreground"
            }`}
          >
            ✍️ Sugestões
          </button>
        </div>
      </div>

      {abacom === "comentarios" && (
        <div className="mt-4 rounded-xl border border-line fundo-papel p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Comentários</h3>

          {logado ? (
            <div className="mb-4">
              <textarea
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                rows={3}
                maxLength={5000}
                placeholder="Compartilhe sua opinião sobre esta obra…"
                className="w-full rounded-lg border border-inputline bg-surface px-3 py-2 text-sm text-foreground placeholder:text-faint focus:border-accent focus:outline-none"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs text-faint">{novoComentario.length}/5000</span>
                <button
                  type="button"
                  onClick={enviarComentario}
                  disabled={enviandoComentario || !novoComentario.trim()}
                  className={btnPrimario + " px-4 py-1.5 text-xs"}
                >
                  Comentar
                </button>
              </div>
              {erroComentario && <p className="mt-1 text-xs text-danger">{erroComentario}</p>}
            </div>
          ) : (
            <p className="mb-4 text-sm text-muted">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-medium text-accent hover:underline"
              >
                Entre na sua conta
              </button>{" "}
              para comentar.
            </p>
          )}

          {comentariosInicial.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Seja o primeiro a comentar esta obra!
            </p>
          ) : (
            <div className="space-y-3">
              {comentariosInicial.map((c) => (
                <ItemComentario key={c.id} comentario={c} dono={dono} logado={logado} usuarioId={usuarioId} obraId={obraId} />
              ))}
            </div>
          )}
        </div>
      )}

      {abacom === "sugestoes" && (
        <div className="mt-4 rounded-xl border border-line fundo-papel p-5 shadow-sm">
          <h3 className="mb-1 text-lg font-semibold">Sugestões ao autor</h3>
          <p className="mb-4 text-xs text-muted">
            {dono
              ? "Sugestões enviadas por leitores. Use os botões para atualizar o status."
              : "Sugira melhorias, ideias ou correções — só o autor vê o que você enviar."}
          </p>

          {logado && !dono && (
            <div className="mb-4">
              <textarea
                value={novaSugestao}
                onChange={(e) => setNovaSugestao(e.target.value)}
                rows={3}
                maxLength={5000}
                placeholder="Sugira algo para melhorar a obra…"
                className="w-full rounded-lg border border-inputline bg-surface px-3 py-2 text-sm text-foreground placeholder:text-faint focus:border-accent focus:outline-none"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs text-faint">{novaSugestao.length}/5000</span>
                <button
                  type="button"
                  onClick={enviarSugestao}
                  disabled={enviandoSugestao || !novaSugestao.trim()}
                  className={btnPrimario + " px-4 py-1.5 text-xs"}
                >
                  Enviar sugestão
                </button>
              </div>
              {erroSugestao && <p className="mt-1 text-xs text-danger">{erroSugestao}</p>}
            </div>
          )}

          {!logado && (
            <p className="mb-4 text-sm text-muted">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-medium text-accent hover:underline"
              >
                Entre na sua conta
              </button>{" "}
              para enviar sugestões.
            </p>
          )}

          {sugestoesCarregadas && sugestoes.length === 0 && (
            <p className="py-4 text-center text-sm text-muted">
              {dono
                ? "Nenhuma sugestão recebida ainda."
                : "Você ainda não enviou sugestões para esta obra."}
            </p>
          )}

          {sugestoes.length > 0 && (
            <div className="space-y-3">
              {sugestoes.map((s) => (
                <div key={s.id} className="rounded-lg border border-line bg-surface p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Avatar usuario={s.usuario} tamanho="h-6 w-6" />
                    <span className="text-sm font-semibold">{nomeExibicao(s.usuario)}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor:
                          s.status === "PENDENTE"
                            ? "var(--accent, #8a5cf6)"
                            : s.status === "ACEITA"
                              ? "var(--success, #16a34a)"
                              : s.status === "IMPLEMENTADA"
                                ? "var(--info, #0284c7)"
                                : "var(--danger, #dc2626)",
                        color: "#fff",
                      }}
                    >
                      {ROTULO_STATUS_SUGESTAO[s.status] ?? s.status}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-soft">
                    {s.conteudo}
                  </p>
                  {dono && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {STATUS_SUGESTAO.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => mudarStatusSugestao(s.id, st)}
                          className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                            s.status === st
                              ? "border-accent bg-accent text-onaccent"
                              : "border-inputline bg-surface text-muted hover:text-foreground"
                          }`}
                        >
                          {ROTULO_STATUS_SUGESTAO[st] ?? st}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}