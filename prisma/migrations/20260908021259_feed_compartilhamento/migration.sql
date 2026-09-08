-- CreateTable
CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "comentarioPaiId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Comentario_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comentario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comentario_comentarioPaiId_fkey" FOREIGN KEY ("comentarioPaiId") REFERENCES "Comentario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Curtida" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Curtida_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Curtida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sugestao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Sugestao_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Sugestao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Obra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "genero" TEXT,
    "subgenero" TEXT,
    "tema" TEXT,
    "publicoAlvo" TEXT,
    "descricao" TEXT,
    "usuarioId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANEJAMENTO',
    "arquivada" BOOLEAN NOT NULL DEFAULT false,
    "compartilhada" BOOLEAN NOT NULL DEFAULT false,
    "isbn" TEXT,
    "isbn13" TEXT,
    "idioma" TEXT NOT NULL DEFAULT 'pt-BR',
    "dataPublicacao" DATETIME,
    "editora" TEXT,
    "edicao" TEXT DEFAULT '1',
    "direitosAutorais" TEXT,
    "capaUrl" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Obra_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Obra" ("arquivada", "atualizadoEm", "capaUrl", "criadoEm", "dataPublicacao", "descricao", "direitosAutorais", "edicao", "editora", "genero", "id", "idioma", "isbn", "isbn13", "publicoAlvo", "status", "subgenero", "subtitulo", "tema", "titulo", "usuarioId") SELECT "arquivada", "atualizadoEm", "capaUrl", "criadoEm", "dataPublicacao", "descricao", "direitosAutorais", "edicao", "editora", "genero", "id", "idioma", "isbn", "isbn13", "publicoAlvo", "status", "subgenero", "subtitulo", "tema", "titulo", "usuarioId" FROM "Obra";
DROP TABLE "Obra";
ALTER TABLE "new_Obra" RENAME TO "Obra";
CREATE UNIQUE INDEX "Obra_isbn_key" ON "Obra"("isbn");
CREATE UNIQUE INDEX "Obra_isbn13_key" ON "Obra"("isbn13");
CREATE INDEX "Obra_usuarioId_idx" ON "Obra"("usuarioId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Comentario_obraId_idx" ON "Comentario"("obraId");

-- CreateIndex
CREATE INDEX "Comentario_usuarioId_idx" ON "Comentario"("usuarioId");

-- CreateIndex
CREATE INDEX "Comentario_comentarioPaiId_idx" ON "Comentario"("comentarioPaiId");

-- CreateIndex
CREATE INDEX "Curtida_obraId_idx" ON "Curtida"("obraId");

-- CreateIndex
CREATE INDEX "Curtida_usuarioId_idx" ON "Curtida"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Curtida_obraId_usuarioId_key" ON "Curtida"("obraId", "usuarioId");

-- CreateIndex
CREATE INDEX "Sugestao_obraId_idx" ON "Sugestao"("obraId");

-- CreateIndex
CREATE INDEX "Sugestao_usuarioId_idx" ON "Sugestao"("usuarioId");
