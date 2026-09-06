/**
 * Carregamento das tries de dicionário (CSpell) em cache por idioma.
 *
 * A engine nspell + dictionary-pt foi REJEITADA por benchmark (parse do pt-BR
 * levou > 5min). As tries compiladas do CSpell carregam em ~400ms e as buscas
 * são instantâneas. Os arquivos vivem em `src/lib/revisao/assets/` (cópias dos
 * pacotes @cspell/dict-*, que não exportam o .trie.gz via `exports`).
 *
 * Sempre servidor (node:fs / node:zlib). Não importar em client components.
 */

import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import { decodeTrie, type ITrie } from "cspell-trie-lib";
import {
  arquivoTrie,
  normalizarIdioma,
  type IdiomaRevisao,
} from "./idiomas";

type CacheGlobal = { __tries?: Partial<Record<IdiomaRevisao, Promise<ITrie>>> };

/** Cache por idioma no globalThis (sobrevive ao hot reload do dev). */
export function obterTrie(
  idioma: IdiomaRevisao | string = "pt-BR",
): Promise<ITrie> {
  const normalizado = normalizarIdioma(idioma);
  const g = globalThis as unknown as CacheGlobal;
  g.__tries ??= {};
  g.__tries[normalizado] ??= carregarTrie(normalizado);
  return g.__tries[normalizado] as Promise<ITrie>;
}

async function carregarTrie(idioma: IdiomaRevisao): Promise<ITrie> {
  const t0 = Date.now();
  const caminho = join(
    process.cwd(),
    "src/lib/revisao/assets",
    arquivoTrie(idioma),
  );
  const compactado = await readFile(caminho);
  const descomprimido = gunzipSync(compactado);
  const trie = decodeTrie(descomprimido);
  console.log(
    `[revisao] dicionário ${idioma} carregado em ${Date.now() - t0}ms ` +
      `(${compactado.length} bytes -> ${descomprimido.length} bytes)`,
  );
  return trie;
}