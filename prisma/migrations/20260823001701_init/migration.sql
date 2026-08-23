-- CreateTable
CREATE TABLE "Obra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "genero" TEXT,
    "subgenero" TEXT,
    "tema" TEXT,
    "publicoAlvo" TEXT,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANEJAMENTO',
    "arquivada" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Esqueleto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "premissa" TEXT,
    "conflitoPrincipal" TEXT,
    "conflitosSecundarios" TEXT,
    "objetivoProtagonista" TEXT,
    "transformacaoProtagonista" TEXT,
    "eventosPrincipais" TEXT,
    "pontosVirada" TEXT,
    "climax" TEXT,
    "desfecho" TEXT,
    CONSTRAINT "Esqueleto_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Capitulo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "objetivo" TEXT,
    "ordemEscrita" INTEGER NOT NULL,
    "ordemNarrativa" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PLANEJADO',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Capitulo_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Parte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "capituloId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    CONSTRAINT "Parte_capituloId_fkey" FOREIGN KEY ("capituloId") REFERENCES "Capitulo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cena" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT,
    "conteudo" TEXT NOT NULL DEFAULT '',
    "objetivo" TEXT,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Cena_parteId_fkey" FOREIGN KEY ("parteId") REFERENCES "Parte" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Personagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'SECUNDARIO',
    "fisico" TEXT,
    "psicologico" TEXT,
    "historia" TEXT,
    "comportamento" TEXT,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Personagem_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RelacaoPersonagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "origemId" TEXT NOT NULL,
    "destinoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    CONSTRAINT "RelacaoPersonagem_origemId_fkey" FOREIGN KEY ("origemId") REFERENCES "Personagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RelacaoPersonagem_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "Personagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ambiente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "localizacao" TEXT,
    "descricao" TEXT,
    "epoca" TEXT,
    "importanciaNarrativa" TEXT,
    CONSTRAINT "Ambiente_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventoLinhaDoTempo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "escalaTemporal" TEXT NOT NULL DEFAULT 'INDEFINIDO',
    "dataInicio" JSONB,
    "dataFim" JSONB,
    "ordemCronologica" INTEGER NOT NULL,
    "capituloId" TEXT,
    CONSTRAINT "EventoLinhaDoTempo_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventoLinhaDoTempo_capituloId_fkey" FOREIGN KEY ("capituloId") REFERENCES "Capitulo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CenaPersonagem" (
    "cenaId" TEXT NOT NULL,
    "personagemId" TEXT NOT NULL,

    PRIMARY KEY ("cenaId", "personagemId"),
    CONSTRAINT "CenaPersonagem_cenaId_fkey" FOREIGN KEY ("cenaId") REFERENCES "Cena" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CenaPersonagem_personagemId_fkey" FOREIGN KEY ("personagemId") REFERENCES "Personagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CenaAmbiente" (
    "cenaId" TEXT NOT NULL,
    "ambienteId" TEXT NOT NULL,

    PRIMARY KEY ("cenaId", "ambienteId"),
    CONSTRAINT "CenaAmbiente_cenaId_fkey" FOREIGN KEY ("cenaId") REFERENCES "Cena" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CenaAmbiente_ambienteId_fkey" FOREIGN KEY ("ambienteId") REFERENCES "Ambiente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CanonInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "ehSegredoAutor" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "CanonInfo_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegraObra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "RegraObra_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnaliseIA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "escopo" TEXT NOT NULL,
    "modeloIA" TEXT,
    "resumo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnaliseIA_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AchadoIA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analiseId" TEXT NOT NULL,
    "severidade" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "trecho" TEXT NOT NULL,
    "evidencia" TEXT,
    "explicacao" TEXT NOT NULL,
    "sugestao" TEXT,
    "capituloId" TEXT,
    "parteId" TEXT,
    "cenaId" TEXT,
    "offsetInicio" INTEGER,
    "offsetFim" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "justificativaAutor" TEXT,
    "resolvidoEm" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AchadoIA_analiseId_fkey" FOREIGN KEY ("analiseId") REFERENCES "AnaliseIA" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AchadoIA_capituloId_fkey" FOREIGN KEY ("capituloId") REFERENCES "Capitulo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AchadoIA_parteId_fkey" FOREIGN KEY ("parteId") REFERENCES "Parte" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AchadoIA_cenaId_fkey" FOREIGN KEY ("cenaId") REFERENCES "Cena" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VersaoCena" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cenaId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VersaoCena_cenaId_fkey" FOREIGN KEY ("cenaId") REFERENCES "Cena" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportacaoArquivo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "conteudoImportado" TEXT,
    "mapeadoParaObra" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportacaoArquivo_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Esqueleto_obraId_key" ON "Esqueleto"("obraId");

-- CreateIndex
CREATE INDEX "Capitulo_obraId_ordemNarrativa_idx" ON "Capitulo"("obraId", "ordemNarrativa");

-- CreateIndex
CREATE UNIQUE INDEX "Capitulo_obraId_ordemNarrativa_key" ON "Capitulo"("obraId", "ordemNarrativa");

-- CreateIndex
CREATE UNIQUE INDEX "Parte_capituloId_tipo_key" ON "Parte"("capituloId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Cena_parteId_tipo_key" ON "Cena"("parteId", "tipo");

-- CreateIndex
CREATE INDEX "Personagem_obraId_idx" ON "Personagem"("obraId");

-- CreateIndex
CREATE INDEX "RelacaoPersonagem_origemId_idx" ON "RelacaoPersonagem"("origemId");

-- CreateIndex
CREATE INDEX "RelacaoPersonagem_destinoId_idx" ON "RelacaoPersonagem"("destinoId");

-- CreateIndex
CREATE INDEX "Ambiente_obraId_idx" ON "Ambiente"("obraId");

-- CreateIndex
CREATE UNIQUE INDEX "EventoLinhaDoTempo_obraId_ordemCronologica_key" ON "EventoLinhaDoTempo"("obraId", "ordemCronologica");

-- CreateIndex
CREATE INDEX "CanonInfo_obraId_idx" ON "CanonInfo"("obraId");

-- CreateIndex
CREATE INDEX "AchadoIA_analiseId_severidade_idx" ON "AchadoIA"("analiseId", "severidade");

-- CreateIndex
CREATE INDEX "AchadoIA_status_idx" ON "AchadoIA"("status");

-- CreateIndex
CREATE INDEX "VersaoCena_cenaId_criadoEm_idx" ON "VersaoCena"("cenaId", "criadoEm");
