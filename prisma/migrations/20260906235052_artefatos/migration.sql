-- CreateTable
CREATE TABLE "Artefato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obraId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "imagemUrl" TEXT,
    "descricao" TEXT,
    "historia" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Artefato_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Artefato_obraId_idx" ON "Artefato"("obraId");
