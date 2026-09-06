-- CreateTable
CREATE TABLE "Autor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "bio" TEXT,
    "fotoUrl" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AutorObra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'AUTOR',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AutorObra_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AutorObra_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Autor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "paiId" TEXT,
    CONSTRAINT "Categoria_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "Categoria" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategoriaObra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "CategoriaObra_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CategoriaObra_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PalavraChaveObra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "termo" TEXT NOT NULL,
    CONSTRAINT "PalavraChaveObra_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "status" TEXT NOT NULL DEFAULT 'PLANEJAMENTO',
    "arquivada" BOOLEAN NOT NULL DEFAULT false,
    "isbn" TEXT,
    "isbn13" TEXT,
    "idioma" TEXT NOT NULL DEFAULT 'pt-BR',
    "dataPublicacao" DATETIME,
    "editora" TEXT,
    "edicao" TEXT DEFAULT '1',
    "direitosAutorais" TEXT,
    "capaUrl" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);
INSERT INTO "new_Obra" ("arquivada", "atualizadoEm", "criadoEm", "descricao", "genero", "id", "publicoAlvo", "status", "subgenero", "tema", "titulo") SELECT "arquivada", "atualizadoEm", "criadoEm", "descricao", "genero", "id", "publicoAlvo", "status", "subgenero", "tema", "titulo" FROM "Obra";
DROP TABLE "Obra";
ALTER TABLE "new_Obra" RENAME TO "Obra";
CREATE UNIQUE INDEX "Obra_isbn_key" ON "Obra"("isbn");
CREATE UNIQUE INDEX "Obra_isbn13_key" ON "Obra"("isbn13");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AutorObra_obraId_idx" ON "AutorObra"("obraId");

-- CreateIndex
CREATE INDEX "AutorObra_autorId_idx" ON "AutorObra"("autorId");

-- CreateIndex
CREATE UNIQUE INDEX "AutorObra_obraId_autorId_key" ON "AutorObra"("obraId", "autorId");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_codigo_key" ON "Categoria"("codigo");

-- CreateIndex
CREATE INDEX "Categoria_paiId_idx" ON "Categoria"("paiId");

-- CreateIndex
CREATE INDEX "CategoriaObra_obraId_idx" ON "CategoriaObra"("obraId");

-- CreateIndex
CREATE INDEX "CategoriaObra_categoriaId_idx" ON "CategoriaObra"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaObra_obraId_categoriaId_key" ON "CategoriaObra"("obraId", "categoriaId");

-- CreateIndex
CREATE INDEX "PalavraChaveObra_obraId_idx" ON "PalavraChaveObra"("obraId");

-- CreateIndex
CREATE UNIQUE INDEX "PalavraChaveObra_obraId_termo_key" ON "PalavraChaveObra"("obraId", "termo");
