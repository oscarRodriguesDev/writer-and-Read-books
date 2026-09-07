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
INSERT INTO "new_Obra" ("arquivada", "atualizadoEm", "capaUrl", "criadoEm", "dataPublicacao", "descricao", "direitosAutorais", "edicao", "editora", "genero", "id", "idioma", "isbn", "isbn13", "publicoAlvo", "status", "subgenero", "subtitulo", "tema", "titulo") SELECT "arquivada", "atualizadoEm", "capaUrl", "criadoEm", "dataPublicacao", "descricao", "direitosAutorais", "edicao", "editora", "genero", "id", "idioma", "isbn", "isbn13", "publicoAlvo", "status", "subgenero", "subtitulo", "tema", "titulo" FROM "Obra";
DROP TABLE "Obra";
ALTER TABLE "new_Obra" RENAME TO "Obra";
CREATE UNIQUE INDEX "Obra_isbn_key" ON "Obra"("isbn");
CREATE UNIQUE INDEX "Obra_isbn13_key" ON "Obra"("isbn13");
CREATE INDEX "Obra_usuarioId_idx" ON "Obra"("usuarioId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
