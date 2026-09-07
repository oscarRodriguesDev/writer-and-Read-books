-- CreateTable
CREATE TABLE "Ato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "sinopse" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Ato_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Capitulo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "objetivo" TEXT,
    "ordemEscrita" INTEGER NOT NULL,
    "ordemNarrativa" INTEGER,
    "atoId" TEXT,
    "ordemDentroDoAto" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PLANEJADO',
    "imagemUrl" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Capitulo_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Capitulo_atoId_fkey" FOREIGN KEY ("atoId") REFERENCES "Ato" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Capitulo" ("atualizadoEm", "criadoEm", "id", "imagemUrl", "objetivo", "obraId", "ordemEscrita", "ordemNarrativa", "status", "titulo") SELECT "atualizadoEm", "criadoEm", "id", "imagemUrl", "objetivo", "obraId", "ordemEscrita", "ordemNarrativa", "status", "titulo" FROM "Capitulo";
DROP TABLE "Capitulo";
ALTER TABLE "new_Capitulo" RENAME TO "Capitulo";
CREATE INDEX "Capitulo_obraId_ordemNarrativa_idx" ON "Capitulo"("obraId", "ordemNarrativa");
CREATE INDEX "Capitulo_atoId_ordemDentroDoAto_idx" ON "Capitulo"("atoId", "ordemDentroDoAto");
CREATE UNIQUE INDEX "Capitulo_obraId_ordemNarrativa_key" ON "Capitulo"("obraId", "ordemNarrativa");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Ato_obraId_idx" ON "Ato"("obraId");

-- CreateIndex
CREATE UNIQUE INDEX "Ato_obraId_ordem_key" ON "Ato"("obraId", "ordem");
