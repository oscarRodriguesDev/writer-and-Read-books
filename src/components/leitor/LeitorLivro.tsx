"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type AnimationEvent,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { btnPrimario, btnSecundario } from "@/components/ui";
import {
  CONFIG_LEITOR_PADRAO,
  lerConfigLeitor,
  paginizarCapitulo,
  palavrasDaDensidade,
  salvarConfigLeitor,
  type AnimacaoPagina,
  type CapituloLeitura,
  type ConfigLeitor,
  type DensidadePagina,
  type PaginaLeitura,
} from "@/lib/leitor";
import { cn } from "@/lib/utils";
import LeitorConfiguracoes from "./LeitorConfiguracoes";

type Props = {
  obraId: string;
  capitulos: CapituloLeitura[];
  capInicial: number;
  pagInicial: number;
  /** Ativa proteção de conteúdo (sem copiar/colar/imprimir/baixar imagens).
   *  Usado para leitura pública de obras compartilhadas. */
  protegido?: boolean;
  /** Link do botão "←" no topo (padrão: área privada da obra). */
  voltarHref?: string;
  /** Rótulo do botão "←" no topo. */
  voltarLabel?: string;
  /** Base das URLs de navegação (padrão: /ler/[obraId]). */
  rotaBase?: string;
  /** Visitante (deslogado): sem configurações de leitura, animação sempre
   *  "flip" e — ao avançar páginas — sugestão de login/cadastro. */
  visitante?: boolean;
};

type FaseAnimacao = "frente" | "voltar";

function CorpoPagina({
  capitulo,
  pagina,
  mostrarTitulo,
}: {
  capitulo: CapituloLeitura;
  pagina: PaginaLeitura;
  mostrarTitulo: boolean;
}) {
  return (
    <article className="livro-texto">
      {mostrarTitulo && (
        <h1 className="mb-10 text-center text-3xl font-bold tracking-tight">
          {capitulo.titulo}
        </h1>
      )}
      {pagina.blocos.map((bloco, i) =>
        bloco.tipo === "tituloParte" ? (
          <h2
            key={i}
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint"
          >
            {bloco.rotulo}
          </h2>
        ) : (
          <p key={i} className="mb-4 whitespace-pre-wrap">
            {bloco.texto}
          </p>
        ),
      )}
    </article>
  );
}

export default function LeitorLivro({
  obraId,
  capitulos,
  capInicial,
  pagInicial,
  protegido = false,
  voltarHref,
  voltarLabel = "Obra",
  rotaBase,
  visitante = false,
}: Props) {
  const router = useRouter();

  const [capituloIdx, setCapituloIdx] = useState(capInicial);
  const [paginaIdx, setPaginaIdx] = useState(pagInicial);
  const [animando, setAnimando] = useState(false);
  const [fase, setFase] = useState<FaseAnimacao | null>(null);
  const [flatAlvo, setFlatAlvo] = useState<number | null>(null);
  const [animacao, setAnimacao] = useState<AnimacaoPagina>(CONFIG_LEITOR_PADRAO.animacao);
  const [densidade, setDensidade] = useState<DensidadePagina>(CONFIG_LEITOR_PADRAO.densidade);
  const [alturaVitrine, setAlturaVitrine] = useState<number>();
  const [sugestaoLoginAberta, setSugestaoLoginAberta] = useState(false);

  const baseRef = useRef<HTMLDivElement>(null);
  const topoRef = useRef<HTMLDivElement>(null);
  const ancoraRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<ConfigLeitor>(CONFIG_LEITOR_PADRAO);

  // Carrega as preferências só no cliente (evita mismatch de hidratação).
  // Visitante: sem configurações — animação de página SEMPRE "flip".
  useEffect(() => {
    const config = lerConfigLeitor();
    setDensidade(config.densidade);
    setAnimacao(visitante ? "flip" : config.animacao);
  }, [visitante]);

  useEffect(() => {
    configRef.current = { animacao, densidade };
  }, [animacao, densidade]);

  const salvarAnimacao = useCallback((nova: AnimacaoPagina) => {
    setAnimacao(nova);
    salvarConfigLeitor({ ...configRef.current, animacao: nova });
  }, []);

  const salvarDensidade = useCallback((nova: DensidadePagina) => {
    setDensidade(nova);
    salvarConfigLeitor({ ...configRef.current, densidade: nova });
  }, []);

  const rolarParaTopo = useCallback(() => {
    ancoraRef.current?.scrollIntoView({
      behavior: "instant" as ScrollBehavior,
      block: "start",
    });
  }, []);

  // ---- Paginação (recálculo quando muda a densidade) ----
  const palavrasPorPagina = palavrasDaDensidade(densidade);

  const paginado = useMemo(
    () => capitulos.map((c) => paginizarCapitulo(c, palavrasPorPagina)),
    [capitulos, palavrasPorPagina],
  );

  const paginasPorCapitulo = useMemo(() => paginado.map((p) => p.length), [paginado]);

  const prefixos = useMemo(() => {
    const arr: number[] = [];
    let soma = 0;
    for (let i = 0; i < paginasPorCapitulo.length; i++) {
      arr.push(soma);
      soma += paginasPorCapitulo[i];
    }
    return arr;
  }, [paginasPorCapitulo]);

  const totalPaginas = useMemo(
    () => paginasPorCapitulo.reduce((s, n) => s + n, 0),
    [paginasPorCapitulo],
  );

  // Garante que o índice de página nunca fure o capítulo (muda de densidade etc.)
  const paginaSegura = Math.min(paginaIdx, paginasPorCapitulo[capituloIdx] - 1);
  const flatAtual = prefixos[capituloIdx] + paginaSegura;

  const decomporFlat = useCallback(
    (flat: number): { c: number; p: number } => {
      let c = 0;
      while (c < capitulos.length - 1 && flat >= prefixos[c] + paginasPorCapitulo[c]) {
        c++;
      }
      return { c, p: flat - prefixos[c] };
    },
    [capitulos.length, prefixos, paginasPorCapitulo],
  );

  const navegar = useCallback(
    (alvo: number) => {
      if (animando) return;
      if (alvo < 0 || alvo >= totalPaginas || alvo === flatAtual) return;

      // Visitante deslogado: a cada avanço de página, sugere login/cadastro
      if (visitante && alvo > flatAtual) setSugestaoLoginAberta(true);

      const faseDir: FaseAnimacao = alvo > flatAtual ? "frente" : "voltar";
      const { c, p } = decomporFlat(alvo);
      router.replace(`${rotaBase ?? `/ler/${obraId}`}?cap=${c}&pag=${p}`, { scroll: false });

      if (animacao === "nenhuma") {
        setCapituloIdx(c);
        setPaginaIdx(p);
        rolarParaTopo();
        return;
      }

      setFlatAlvo(alvo);
      setFase(faseDir);
      setAnimando(true);
    },
    [animacao, animando, decomporFlat, flatAtual, obraId, rolarParaTopo, router, visitante, totalPaginas],
  );

  // Redirect de visitante deslogado para login/cadastro, voltando ao leitor
  const irParaLogin = useCallback(() => {
    const cb = encodeURIComponent(window.location.pathname + window.location.search);
    router.push(`/login?callbackUrl=${cb}`);
  }, [router]);

  const irParaCadastro = useCallback(() => {
    const cb = encodeURIComponent(window.location.pathname + window.location.search);
    router.push(`/cadastro?callbackUrl=${cb}`);
  }, [router]);

  const finalizarAnimacao = useCallback(
    (e: AnimationEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (!animando || flatAlvo === null) return;
      const { c, p } = decomporFlat(flatAlvo);
      setCapituloIdx(c);
      setPaginaIdx(p);
      setAnimando(false);
      setFase(null);
      setFlatAlvo(null);
      setAlturaVitrine(undefined);
      rolarParaTopo();
    },
    [animando, decomporFlat, flatAlvo, rolarParaTopo],
  );

  // Durante a animação as duas páginas ficam absolutas: mede a maior e
  // fixa a altura da vitrine para não pular layout nem cortar conteúdo.
  useLayoutEffect(() => {
    if (!animando) {
      setAlturaVitrine(undefined);
      return;
    }
    const hBase = baseRef.current?.offsetHeight ?? 0;
    const hTopo = topoRef.current?.offsetHeight ?? 0;
    const h = Math.max(hBase, hTopo);
    setAlturaVitrine(h > 0 ? h : undefined);
  }, [animando]);

  const flipAtivo = animando && animacao === "flip";
  const animandoComFase = animando && flatAlvo !== null && fase !== null;

  // Descompõe as páginas de baixo (visível) e de cima (animada)
  let baseDecomp: { c: number; p: number } | null = null;
  let topoDecomp: { c: number; p: number } | null = null;
  if (animandoComFase && flatAlvo !== null) {
    if (animacao === "flip") {
      if (fase === "frente") {
        baseDecomp = decomporFlat(flatAlvo);
        topoDecomp = { c: capituloIdx, p: paginaSegura };
      } else {
        baseDecomp = { c: capituloIdx, p: paginaSegura };
        topoDecomp = decomporFlat(flatAlvo);
      }
    } else {
      // Suave: só a página que entra anima (não precisa de base)
      topoDecomp = decomporFlat(flatAlvo);
    }
  }

  const capituloAtual = capitulos[capituloIdx];
  const paginasCapituloAtual = paginado[capituloIdx];
  const temAnterior = flatAtual > 0;
  const temProximo = flatAtual < totalPaginas - 1;

  // Navegação por teclado (setas) — handler único, lê o estado por refs
  const navegarRef = useRef(navegar);
  useEffect(() => {
    navegarRef.current = navegar;
  }, [navegar]);

  const flatAtualRef = useRef(flatAtual);
  useEffect(() => {
    flatAtualRef.current = flatAtual;
  }, [flatAtual]);

  useEffect(() => {
    const aoTeclado = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const alvo = e.target as HTMLElement | null;
      if (
        alvo &&
        (alvo.tagName === "INPUT" ||
          alvo.tagName === "TEXTAREA" ||
          alvo.tagName === "SELECT" ||
          alvo.isContentEditable)
      )
        return;
      // Com o painel de configurações aberto, deixa o teclado livre
      if (
        document
          .querySelector('button[aria-label="Configurações do leitor"]')
          ?.getAttribute("aria-expanded") === "true"
      )
        return;
      e.preventDefault();
      const atual = flatAtualRef.current;
      navegarRef.current(e.key === "ArrowRight" ? atual + 1 : atual - 1);
    };
    window.addEventListener("keydown", aoTeclado);
    return () => window.removeEventListener("keydown", aoTeclado);
  }, []);

  // ---- Proteção de conteúdo (obras compartilhadas) ----
  // Bloqueia copiar/colar/recortar, menu de contexto, Ctrl+P (imprimir) e
  // arrastar imagens. É uma proteção client-side: impede o uso casual.
  useEffect(() => {
    if (!protegido) return;

    const bloquearCopiar = (e: ClipboardEvent) => {
      e.preventDefault();
    };
    const bloquearContexto = (e: globalThis.MouseEvent) => {
      e.preventDefault();
    };
    const bloquearTecla = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "p", "x", "s", "a"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    };
    const bloquearDrag = (e: DragEvent) => {
      e.preventDefault();
    };

    // Cobre toda a página (imagens fora do componente também ficam seguras)
    document.addEventListener("copy", bloquearCopiar);
    document.addEventListener("cut", bloquearCopiar);
    document.addEventListener("paste", bloquearCopiar);
    document.addEventListener("contextmenu", bloquearContexto);
    document.addEventListener("keydown", bloquearTecla);
    document.addEventListener("dragstart", bloquearDrag);
    return () => {
      document.removeEventListener("copy", bloquearCopiar);
      document.removeEventListener("cut", bloquearCopiar);
      document.removeEventListener("paste", bloquearCopiar);
      document.removeEventListener("contextmenu", bloquearContexto);
      document.removeEventListener("keydown", bloquearTecla);
      document.removeEventListener("dragstart", bloquearDrag);
    };
  }, [protegido]);

  // Clique no lado direito avança; no esquerdo retrocede
  const aoClicarVitrine = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (animando) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      navegar(flatAtual + (x < rect.width / 2 ? -1 : 1));
    },
    [animando, flatAtual, navegar],
  );

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl",
        protegido && "livro-protegido select-none",
      )}
    >
      <header className="mb-5 flex items-center justify-between gap-3">
        <Link
          href={voltarHref ?? `/obras/${obraId}`}
          className={cn(btnSecundario, "px-3 py-2 text-sm")}
        >
          ← {voltarLabel}
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted">
            Capítulo {capituloIdx + 1} de {capitulos.length}
            {paginasCapituloAtual.length > 1 &&
              ` · Página ${paginaSegura + 1} de ${paginasCapituloAtual.length}`}
          </p>
          {!visitante && (
            <LeitorConfiguracoes
              animacao={animacao}
              aoMudarAnimacao={salvarAnimacao}
              densidade={densidade}
              aoMudarDensidade={salvarDensidade}
            />
          )}
          {visitante && (
            <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
              Leitura pública
            </span>
          )}
        </div>
      </header>

      <div
        className={cn(
          "livro-vitrine group relative cursor-pointer",
          animando && fase === "frente" && "livro-virar-frente",
          animando && fase === "voltar" && "livro-virar-voltar",
          animando && animacao === "suave" && "livro-suave",
        )}
        style={alturaVitrine ? { height: alturaVitrine } : undefined}
        onClick={aoClicarVitrine}
      >
        {/* âncora do topo da leitura (scroll pós-animação respeita a TopBar fixa) */}
        <div ref={ancoraRef} className="scroll-mt-20" aria-hidden />

        {/* dicas laterais de clique (aparecem no hover) */}
        {temAnterior && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-2 top-1/2 z-20 -translate-y-1/2 text-3xl text-faint opacity-0 transition-opacity duration-fast group-hover:opacity-60"
          >
            ‹
          </span>
        )}
        {temProximo && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-2 top-1/2 z-20 -translate-y-1/2 text-3xl text-faint opacity-0 transition-opacity duration-fast group-hover:opacity-60"
          >
            ›
          </span>
        )}

        {flipAtivo && baseDecomp && (
          <div
            ref={baseRef}
            className="livro-pagina absolute inset-x-0 top-0 min-h-[55vh] px-8 py-10 sm:px-12"
          >
            <CorpoPagina
              capitulo={capitulos[baseDecomp.c]}
              pagina={paginado[baseDecomp.c][baseDecomp.p]}
              mostrarTitulo={baseDecomp.p === 0}
            />
          </div>
        )}

        {!animando && (
          <div className="livro-pagina min-h-[55vh] px-8 py-10 sm:px-12">
            <CorpoPagina
              capitulo={capituloAtual}
              pagina={paginasCapituloAtual[paginaSegura]}
              mostrarTitulo={paginaSegura === 0}
            />
          </div>
        )}

        {topoDecomp && animacao === "flip" && (
          <div
            ref={topoRef}
            className="livro-topo absolute inset-x-0 top-0 z-10"
            onAnimationEnd={finalizarAnimacao}
          >
            <div className="livro-face">
              <div className="livro-pagina min-h-[55vh] px-8 py-10 sm:px-12">
                <CorpoPagina
                  capitulo={capitulos[topoDecomp.c]}
                  pagina={paginado[topoDecomp.c][topoDecomp.p]}
                  mostrarTitulo={topoDecomp.p === 0}
                />
              </div>
            </div>
            {/* Verso da página: papel (aparece durante a virada) */}
            <div className="livro-verso livro-face absolute inset-0" aria-hidden>
              <div className="livro-pagina h-full" />
            </div>
          </div>
        )}

        {topoDecomp && animacao === "suave" && (
          <div
            ref={topoRef}
            className="livro-topo absolute inset-x-0 top-0 z-10"
            onAnimationEnd={finalizarAnimacao}
          >
            <div className="livro-pagina min-h-[55vh] px-8 py-10 sm:px-12">
              <CorpoPagina
                capitulo={capitulos[topoDecomp.c]}
                pagina={paginado[topoDecomp.c][topoDecomp.p]}
                mostrarTitulo={topoDecomp.p === 0}
              />
            </div>
          </div>
        )}
      </div>

      <nav className="mt-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navegar(0)}
            disabled={!temAnterior || animando}
            title="Ir para a primeira página"
            className={cn(btnSecundario, "disabled:pointer-events-none disabled:opacity-50")}
          >
            « Primeira
          </button>
          <button
            type="button"
            onClick={() => navegar(flatAtual - 1)}
            disabled={!temAnterior || animando}
            className={cn(btnSecundario, "disabled:pointer-events-none disabled:opacity-50")}
          >
            ← Anterior
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navegar(flatAtual + 1)}
            disabled={!temProximo || animando}
            className={cn(btnSecundario, "disabled:pointer-events-none disabled:opacity-50")}
          >
            Próximo →
          </button>
          <button
            type="button"
            onClick={() => navegar(totalPaginas - 1)}
            disabled={!temProximo || animando}
            title="Ir para a última página"
            className={cn(btnSecundario, "disabled:pointer-events-none disabled:opacity-50")}
          >
            Última »
          </button>
        </div>
      </nav>

      {/* Sugestão de login/cadastro para visitantes (aparece a cada avanço de página) */}
      {visitante && sugestaoLoginAberta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sugestao-login-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSugestaoLoginAberta(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-line fundo-papel p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="sugestao-login-titulo" className="text-lg font-bold text-foreground">
              Gostando da leitura? 📖
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-soft">
              Entre ou crie sua conta para <strong className="text-foreground">curtir</strong>,{" "}
              <strong className="text-foreground">comentar</strong> e enviar{" "}
              <strong className="text-foreground">sugestões</strong> aos autores desta
              comunidade.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={irParaLogin}
                className={cn(btnPrimario, "w-full justify-center")}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={irParaCadastro}
                className={cn(btnSecundario, "w-full justify-center")}
              >
                Criar conta grátis
              </button>
              <button
                type="button"
                onClick={() => setSugestaoLoginAberta(false)}
                className="mt-1 text-sm text-muted transition-colors hover:text-foreground"
              >
                Continuar lendo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}