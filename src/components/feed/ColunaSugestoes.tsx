import Link from "next/link";
import { CapaLivro } from "@/components/CapaLivro";

export type ObraSugerida = {
  id: string;
  titulo: string;
  genero: string | null;
  subgenero: string | null;
  capaUrl: string | null;
  autor: string;
  curtidas: number;
};

export type AutorSugerido = {
  id: string;
  nome: string;
  nomeAutor: string | null;
  username: string | null;
  fotoUrl: string | null;
  obrasCompartilhadas: number;
};

/**
 * Coluna lateral direita do leitor público: sugestões de livros da
 * plataforma, autores em destaque e (futuro) anúncios de outras plataformas.
 */
export function ColunaSugestoes({
  obras,
  autores,
}: {
  obras: ObraSugerida[];
  autores: AutorSugerido[];
}) {
  return (
    <aside className="hidden lg:block" aria-label="Sugestões da plataforma">
      <div className="sticky top-20 space-y-5">
        {/* Livros da plataforma */}
        <section className="rounded-xl border border-line fundo-papel p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            📚 Livros da plataforma
          </h2>
          <ul className="space-y-3">
            {obras.length === 0 && (
              <li className="text-xs text-faint">Nenhuma sugestão por enquanto.</li>
            )}
            {obras.map((obra) => (
              <li key={obra.id}>
                <Link
                  href={`/feed/${obra.id}`}
                  className="group flex items-center gap-3 rounded-lg transition-colors hover:bg-hoverbg"
                  title={`${obra.titulo} — ${obra.autor}`}
                >
                  <CapaLivro
                    titulo={obra.titulo}
                    autor={obra.autor}
                    genero={obra.genero ?? undefined}
                    capaUrl={obra.capaUrl}
                    className="w-11 flex-shrink-0"
                    compacto
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground group-hover:text-accent">
                      {obra.titulo}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {obra.autor}
                      {obra.genero && ` · ${obra.genero}`}
                    </span>
                    <span className="block text-[11px] text-faint">
                      ❤️ {obra.curtidas.toLocaleString("pt-BR")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Autores em destaque */}
        <section className="rounded-xl border border-line fundo-papel p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            ✍️ Autores em destaque
          </h2>
          <ul className="space-y-2.5">
            {autores.length === 0 && (
              <li className="text-xs text-faint">Nenhum autor por enquanto.</li>
            )}
            {autores.map((autor) => (
              <li key={autor.id} className="flex items-center gap-3">
                {/* Futuro: link para a página pública do autor */}
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-chipbg text-xs font-bold text-accent">
                  {autor.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={autor.fotoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (autor.nomeAutor ?? autor.nome ?? "?").charAt(0).toUpperCase()
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {autor.nomeAutor ?? autor.nome}
                  </span>
                  <span className="block text-xs text-muted">
                    {autor.obrasCompartilhadas}{" "}
                    {autor.obrasCompartilhadas === 1 ? "obra" : "obras"} compartilhada
                    {autor.obrasCompartilhadas === 1 ? "" : "s"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Anúncios (MOCK por enquanto — futuro: anúncios reais de outras
            plataformas). Clique não leva a lugar nenhum: apenas visual. */}
        <section className="space-y-3" aria-label="Anúncios">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">📣 Anúncios</h2>
            <span className="text-[10px] uppercase tracking-wider text-faint">
              • Anúncio
            </span>
          </div>
          {MOCK_ANUNCIOS.map((anuncio) => (
            <div
              key={anuncio.nome}
              className="block rounded-xl border border-line p-4 shadow-sm transition-shadow hover:shadow-md"
              style={{ backgroundColor: anuncio.cor }}
            >
              <span className="block text-2xl" aria-hidden>
                {anuncio.emoji}
              </span>
              <span className="mt-1 block text-sm font-semibold text-foreground">
                {anuncio.nome}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-soft">
                {anuncio.texto}
              </span>
              <span className="mt-2 inline-block rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-accent ring-1 ring-line">
                Saiba mais
              </span>
            </div>
          ))}
        </section>
      </div>
    </aside>
  );
}

// Anúncios fictícios para ocupar o espaço reservado (futuro: anúncios reais)
const MOCK_ANUNCIOS = [
  {
    emoji: "🎧",
    nome: "Audiolivros Já",
    texto: "Ouça suas histórias favoritas em qualquer lugar. 30 dias grátis.",
    cor: "#f3e8ff",
  },
  {
    emoji: "📖",
    nome: "Clube de Leitura Semanal",
    texto: "Participe de discussões toda semana com leitores de todo Brasil.",
    cor: "#e0f2fe",
  },
  {
    emoji: "✍️",
    nome: "Oficina de Escrita Criativa",
    texto: "Aulas com autores premiados. Novas turmas todo mês.",
    cor: "#dcfce7",
  },
];