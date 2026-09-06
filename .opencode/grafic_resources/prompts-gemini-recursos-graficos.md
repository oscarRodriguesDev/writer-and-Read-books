# 🎨 Prompts para gerar recursos gráficos no Gemini

> **Objetivo**: tirar a seriedade do sistema e deixá-lo mais cômico e inspirador.
> A aplicação é um editor de livros para escritores — a interface precisa estimular
> a criatividade e fazer o autor sorrir enquanto escreve.
>
> **Como usar**: copie o prompt, cole no Gemini (modelo de imagem), ajuste cores se
> precisar e baixe o resultado em PNG. Antes de usar, verifique:
> - **Mascotes, personagens e ilustrações** → PNG com fundo transparente, alta resolução
> - **Interface (UI)** → respeite a paleta e os espaços reservados da tela

## Paleta e estilo da aplicação (referência p/ os prompts)

- Fundos: claro (`--background`) e escuro (`--surface`) — a UI é clara/limpa
- Acentos: tons pastel (azul suave, verde, roxo claro)
- Estilo: **flat illustration, traço arredondado, cores vibrantes mas suaves, sem
  realismo** — clima de "caderno de escritor criativo"
- Tom: cômico, atrapalhado, carismático — personagens "de desenho animado" que erram
  de propósito e fazem piada

---

## 1. Mascote principal da aplicação

**Uso**: sidebar, empty states, tela de carregamento, mensagens de sucesso
**Formato**: PNG fundo transparente + variação em SVG possível

```
Crie um mascote fofo e cômico de um "monstrinho escritor" para um app de escrita
de livros. O mascote é um pequeno polvo roxo/azul com óculos redondos de leitura
e uma caneta-tinteiro segurando em um dos tentáculos. Ele está sentado em uma
pilha de livros desarrumada, cercado de papéis amassados e bolas de papel.
Expressão: frustrado e divertido ao mesmo tempo, bochechas coradas, sorriso
torto. Estilo flat illustration, traços arredondados, cores pastel vibrantes,
cena limpa sem fundo (transparente), proporção de ícone (centralizado), braços
e tentáculos bem definidos para leitura em tamanho pequeno. Tom cômico e
carismático, nunca assustador.
```

**Variações para estados de humor:**

```
Mesmo mascote do prompt anterior (polvo escritor de óculos e caneta), mas agora:
[ESTADO]
- escrevendo: olhos brilhando, empolgado, rabiscando em um caderno, língua para fora
- pensando: dedo/no tentáculo no queixo, olhos virados para cima, balão de
  interrogação ao lado
- feliz: comemorando com os tentáculos para o alto, pequenas estrelinhas ao redor
- chorando/dramático: em cima da pilha de livros, lágrimas de cartum jorrando,
  lenço de papel na mão
- dormindo: de conchinha sobre o teclado, "zzz" flutuando, cobertor de papel
Mantenha o MESMO design: polvo roxo/azul, óculos redondos, caneta-tinteiro.
Flat illustration, cores pastel, fundo transparente.
```

---

## 2. Empty states (telas vazias)

**Uso**: dashboard sem obras, listas vazias (personagens, capítulos, ambientes, linha do tempo)
**Formato**: PNG retangular ~1200×800, fundo transparente ou cor sólida clara

### 2.1 Dashboard — nenhuma obra criada ainda

```
Ilustração cômica em flat illustration para o estado vazio de um app de escrita
de livros. Um mascote polvo escritor (roxo/azul, óculos redondos, caneta-tinteiro)
está abraçado com um caderno gigante em branco, olhando para o caderno com
expressão de desespero cômico. Vários papéis em branco voando ao redor, um
lápis quebrado, xícaras de café vazias empilhadas. Uma pequena placa ao lado
diz "AINDA NÃO LI UMA LINHA" (português). Cores pastel, traços arredondados,
cenário limpo, espaço vazio no centro para texto de overlay. Tom engraçado e
acolhedor, não deprimente.
```

### 2.2 Sem personagens cadastrados

```
Ilustração flat cômica: o mascote polvo escritor segura um microfone e fala para
um palco VAZIO (nenhuma plateia), com um projetor exibindo um contorno de
bonequinho humano vazio. Um balão de fala sobre a cabeça dele diz: "E os meus
personagens? Entraram em cena NÃO!". Cores pastel, traços arredondados, fundo
transparente, espaço para texto overlay. Tom de humor leve.
```

### 2.3 Sem capítulos criados

```
Ilustração flat cômica: o mascote polvo escritor está de frente para uma parede
de post-its VAZIOS e um quadro branco vazio. Ele está com as costas viradas para
um relógio de parede com hora avançada. Expressão de pânico cômico (olhos
arregalados, sorriso nervoso). Alguns post-its caídos no chão. Cores pastel,
traços arredondados, fundo transparente. Tom divertido, inspirador ("vamos
escrever um capítulo!").
```

### 2.4 Sem ambientes

```
Ilustração flat cômica: o mascote polvo escritor está dentro de uma "caixa cênica"
de teatro vazia, segurando uma lanterna apontada para o nada. Ao fundo, um cenário
de papelão com um sol pintado meio torto. Ele olha para o lado com expressão
pensativa e um balão de pensamento com vários pontos de interrogação coloridos.
Cores pastel, traços arredondados, fundo transparente.
```

### 2.5 Sem eventos na linha do tempo

```
Ilustração flat cômica: o mascote polvo escritor está em frente a uma "linha do
tempo" desenhada no chão com giz, mas a linha é quebrada e só tem uma seta solta
no início. Ele está com uma pá de jardim na mão, como se fosse "cavar" um buraco
para enterrar o tempo, expressão de confusão engraçada. Relógios de pulso voando
ao redor (cômico, surreal). Cores pastel, traços arredondados, fundo transparente.
```

---

## 3. Ícones dos módulos (sidebar e navegação)

**Uso**: menu lateral, cards
**Formato**: PNG quadrado ~512×512, fundo transparente, centralizado

```
Conjunto de ícones flat, traço arredondado, cores pastel, fundo transparente,
estilo consistente entre si (mesma espessura de linha, mesmo ar de "caderno de
escritor"). Cada item centralizado com margem generosa:
1. Meus livros: uma pilha de livros com o polvo mascote em cima
2. Personagens: um bonequinho estilizado com capa de herói e carinha de
   "gente boa", ao lado uma máscara dramática de teatro
3. Capítulos: um livro aberto com um lápis escrevendo sozinho
4. Ambientes: uma casinha desenhada em perspectiva isométrica simples com uma
   árvore torta ao lado
5. Linha do tempo: um relógio com engrenagens coloridas e uma seta de tempo
6. Análise de IA: uma cabeça de robô com chapeuzinho de detetive (lupa)
7. Configurações: uma engrenagem com cara (dois olhinhos e sorriso)
8. Exportar: uma caixa de presente de onde sai um livro
9. Tema (claro/escuro): o mesmo mascote polvo de óculos, metade roxo claro
   (dia) e metade estrelado (noite)
```

---

## 4. Ilustrações dos estados de IA (gerando, analisando, revisando)

**Uso**: substituir os emojis/loading atuais nos botões de IA
**Formato**: PNG quadrado ~512×512, fundo transparente

```
Ilustração flat cômica do mascote polvo escritor "no modo IA": o polvo usa um
capacete de astronauta transparente com um brilho de dados dentro, tentáculos
combinando com cabos de computador, olhos focados em uma tela flutuante à
frente. A tela mostra um borrão colorido (rascunho). Estilo flat, cores pastel
(roxo/azul), fundo transparente. Sensação de "trabalhando com tecnologia e
magia", mas ainda fofo e engraçado.
```

**Variação — "analisando o texto":**

```
O mascote polvo escritor está "empilhando" letras gigantes de um alfabeto de
brinquedo (A, B, C coloridas), suando de esforço cômico, uma lupa presa a um
dos óculos. Uma lâmpada de ideia acesa acima da cabeça. Flat illustration,
cores pastel, fundo transparente, quadrado.
```

**Variação — "revisando":**

```
O mascote polvo escritor usa um jaleco de professor e carimba com um carimbo
gigante um papel que diz (em idioma visual, linhas riscadas) — ele está com cara
de "bom garoto" esperando aprovação, com uma caneta vermelha de marca-texto em
outro tentáculo. Flat illustration, cores pastel, fundo transparente, quadrado.
```

---

## 5. Badges e selos (estado das obras / capítulos)

**Uso**: card de obras na dashboard, selos "PLANEJAMENTO | ESCRITA | REVISÃO | CONCLUÍDA"
**Formato**: PNG/emojis estilizados como "selos de adesivo" ~256×256, fundo transparente

```
Quatro selos/adesivos circulares de cartoon com estilo "rolo de fita adesiva"
(colados na diagonal), cada um com uma cor pastel diferente e uma carinhas:
1. PLANEJAMENTO (azul): caderno com checklists riscado, carinha séria de
   planejador, régua e esquadro ao fundo
2. ESCRITA (roxo): teclado e café, carinha empolgada suando de escrever
3. REVISÃO (rosa): óculos e lupa, carinha de "procurando erros" com sobrancelhas
   franzidas engraçadas
4. CONCLUÍDA (verde): troféu com laço, carinha sorridente com confete
Estilo flat, adesivo, fundo transparente, borda branca grossa. Tom cômico e
celebratório.
```

---

## 6. Ilustrações de "sucesso" e mensagens

**Uso**: após exportar, salvar, corrigir ortografia
**Formato**: PNG quadrado ~512×512, fundo transparente

```
O mascote polvo escritor celebrando: jogando papéis para o alto (chuva de
confete de papéis), óculos tortos de empolgação, uma faixa escrito em letras
infantis "BOA!" no peito, estrelinhas e corações de cartum ao redor. Flat
illustration, cores pastel vibrantes, fundo transparente, quadrado.
```

```
O mascote polvo escritor dando "joinha" com um tentáculo e segurando um caneco
de café fumegante, olhos fechados em sorriso bobo. Uma pequena nuvem de
"coraçãozinho" acima da cabeça. Flat illustration, cores pastel, fundo
transparente, quadrado.
```

---

## 7. Elementos decorativos (bordas, divisórias, fundos)

**Uso**: divisórias de seções, topo de páginas, fundo de login
**Formato**: PNG largo (bordas ~1200×64) e padrão repetível (tile)

### 7.1 Divisória de seção (página de obra)

```
Faixa horizontal decorativa estilo "fita de washi tape" com bolinhas coloridas
e carimbos de estrelas, pequenos rascunhos de caneta ao longo da fita (um
coração, uma estrela, um rabisco). Flat illustration, cores pastel, fundo
transparente, muito largo (proporção ~20:1), sem personagem.
```

### 7.2 Padrão de fundo repetível (login / capa)

```
Padrão de fundo sem emenda (seamless tile) em flat illustration: papéis de
rascunho, rabiscos, estrelas, xícaras de café e lápis espalhados de forma
cômica e distribuída, cores pastel MUUUUITO claras (quase brancas), densidade
média (espaço para texto por cima). Nenhum texto. Tons suaves, nunca chamativos.
```

---

## 8. Avatar padrão / placeholder de imagens

**Uso**: personagens, ambientes, capítulos sem imagem
**Formato**: PNG quadrado ~512×512, fundo transparente

### Personagem sem foto

```
Silhueta genérica de bonequinho cartoon com "?" gigante no lugar do rosto,
óculos de sol, cabelo espetado. Uma prancheta pendurada no pescoço com um
rascunho de pessoa rabiscado. Flat illustration, cores pastel, fundo
transparente, quadrado. Tom de "personagem misterioso em construção".
```

### Ambiente sem foto

```
Cartão de "local em construção": uma placa de obras de madeira com um desenho
torto de uma casinha, um capacete de construção em cima da placa, plantas
pequenas. Flat illustration, cores pastel, fundo transparente, quadrado.
```

### Capítulo sem capa

```
Livro fechado sem capa (capa branca lisa) com um "?" colorido estampado, um
lápis em pé ao lado como se estivesse pensando. Flat illustration, cores
pastel, fundo transparente, quadrado.
```

---

## 9. Cena cômica para o "modo leitor"

**Uso**: header da página `/ler/[obraId]` e do editor
**Formato**: PNG retangular ~1600×300 (banner), fundo transparente

```
Banner largo com o mascote polvo escritor reclinado numa poltrona gigante
confortável, lendo um livro com os óculos na testa, lamparina acesa, um gato
(de cartoon simples) deitado ao lado, xícaras de café empilhadas na mesa.
Cara de "modo leitor modo: ON" (sorridente, relaxado). Seu braço/tentáculo
aponta para o lado onde ficaria o texto (espaço vazio à direita). Flat
illustration, cores pastel, fundo transparente ou cor sólida clara, proporção
de banner.
```

---

## 10. Regras gerais para TODOS os prompts

1. **Sempre** flat illustration, traço arredondado, cores pastel, nunca realismo
2. **Fundo transparente** (exceto quando o prompt pedir explicitamente cor sólida)
3. **Consistência**: se reutilizar o mascote, descreva SEMPRE o mesmo design
   (polvo roxo/azul, óculos redondos, caneta-tinteiro, tentáculos)
4. **Espaço para texto**: empty states e banners devem ter área vazia para overlay
5. **Sem texto** na imagem, exceto quando o prompt pedir (evita textos truncados)
6. **Tom**: cômico, acolhedor, criativo — NUNCA assustador, meme agressivo ou pastelão
7. **Resolução**: solicite sempre "alta resolução, nítido para uso em tela (>= 2x)"
8. Priorize PNG (mais versátil para React/Next). SVG apenas para ícones simples