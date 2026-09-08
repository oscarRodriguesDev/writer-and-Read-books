-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cena" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parteId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT,
    "conteudo" TEXT NOT NULL DEFAULT '',
    "objetivo" TEXT,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Cena_parteId_fkey" FOREIGN KEY ("parteId") REFERENCES "Parte" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Cena" ("atualizadoEm", "conteudo", "id", "objetivo", "parteId", "tipo", "titulo") SELECT "atualizadoEm", "conteudo", "id", "objetivo", "parteId", "tipo", "titulo" FROM "Cena";
-- Preserva a sequência herdada: INICIO=1, MEIO=2, FIM=3 (a antiga unique por tipo
-- garantia no máximo uma cena de cada tipo por parte).
UPDATE "new_Cena" SET "ordem" = CASE "tipo" WHEN 'INICIO' THEN 1 WHEN 'MEIO' THEN 2 WHEN 'FIM' THEN 3 ELSE 1 END;
DROP TABLE "Cena";
ALTER TABLE "new_Cena" RENAME TO "Cena";
CREATE UNIQUE INDEX "Cena_parteId_ordem_key" ON "Cena"("parteId", "ordem");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
