-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "idade" INTEGER,
    "generosLiterarios" JSONB,
    "nomeAutor" TEXT,
    "fotoUrl" TEXT,
    "username" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "bio" TEXT,
    "site" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
