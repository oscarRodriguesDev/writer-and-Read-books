import { z } from "zod";

/** String que vira null quando vazia (campos opcionais de formulário). */
export const textoOpcional = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullish(),
  );

/** Idade: campo opcional; texto vazio vira undefined (envio de formulário). */
export const idadeOpcional = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isNaN(n) ? undefined : n;
  },
  z.number().int().min(13, "Idade mínima: 13 anos").max(120, "Idade máxima: 120 anos").optional(),
);

/** Gêneros literários: array JSON; vazio vira []. */
export const generosLiterariosSchema = z.preprocess(
  (v) => (Array.isArray(v) ? v : []),
  z.array(z.string().trim().min(1, "Gênero inválido").max(60)).max(20, "Limite de 20 gêneros").default([]),
);

/** Site/redes sociais: opcional; texto vazio vira null. */
export const siteOpcional = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z
    .string()
    .trim()
    .url("Informe uma URL válida (https://…)")
    .max(500)
    .nullish(),
);

/** POST /api/auth/cadastro — criação de conta. */
export const cadastroSchema = z.object({
  nome: z.string().trim().min(2, "Nome é obrigatório").max(200),
  idade: idadeOpcional,
  generosLiterarios: generosLiterariosSchema,
  nomeAutor: textoOpcional(200),
  fotoUrl: textoOpcional(500),
  username: z
    .string()
    .trim()
    .min(3, "Nome de usuário: mínimo 3 caracteres")
    .max(30, "Nome de usuário: máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Use apenas letras, números e underline")
    .transform((v) => v.toLowerCase()),
  senha: z.string().min(8, "Senha mínima de 8 caracteres").max(100),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  telefone: textoOpcional(30),
  bio: textoOpcional(500),
  site: siteOpcional,
});

/** Login: email OU username + senha. */
export const loginSchema = z.object({
  login: z.string().trim().min(1, "Informe email ou usuário"),
  senha: z.string().min(1, "Informe a senha"),
});

export type CadastroInput = z.infer<typeof cadastroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;