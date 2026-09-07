import { z } from "zod";
import {
  textoOpcional,
  idadeOpcional,
  generosLiterariosSchema,
  siteOpcional,
} from "./autenticacao";

/** PATCH de dados do perfil (não sensíveis). */
export const atualizarPerfilSchema = z.object({
  nome: z.string().trim().min(2, "Nome é obrigatório").max(200),
  idade: idadeOpcional,
  generosLiterarios: generosLiterariosSchema,
  nomeAutor: textoOpcional(200),
  telefone: textoOpcional(30),
  bio: textoOpcional(500),
  site: siteOpcional,
});
export type AtualizarPerfilInput = z.infer<typeof atualizarPerfilSchema>;

/** Payload enviado pelo formulário do perfil (idade vem como texto; o schema
 *  converte e valida). */
export type AtualizarPerfilForm = {
  nome: string;
  idade: string;
  generosLiterarios: string[];
  nomeAutor: string;
  telefone: string;
  bio: string;
  site: string;
};

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Nome de usuário: mínimo 3 caracteres")
  .max(30, "Nome de usuário: máximo 30 caracteres")
  .regex(/^[a-zA-Z0-9_]+$/, "Use apenas letras, números e underline")
  .transform((v) => v.toLowerCase());

const emailSchema = z.string().trim().toLowerCase().email("Email inválido");

/** Troca de email/username — campos sensíveis exigem a senha atual. */
export const atualizarContaSchema = z
  .object({
    email: emailSchema.optional(),
    username: usernameSchema.optional(),
    senhaAtual: z.string().min(1, "Informe a senha atual para confirmar"),
  })
  .refine((d) => d.email !== undefined || d.username !== undefined, {
    message: "Informe o email ou o nome de usuário que deseja alterar",
  });
export type AtualizarContaInput = z.infer<typeof atualizarContaSchema>;

/** Troca de senha — exige a senha atual e confirmação da nova. */
export const atualizarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual"),
    novaSenha: z.string().min(8, "Senha mínima de 8 caracteres").max(100),
    confirmarNovaSenha: z.string().min(1),
  })
  .refine((d) => d.novaSenha === d.confirmarNovaSenha, {
    message: "As novas senhas não coincidem",
    path: ["confirmarNovaSenha"],
  })
  .refine((d) => d.novaSenha !== d.senhaAtual, {
    message: "A nova senha deve ser diferente da atual",
    path: ["novaSenha"],
  });
export type AtualizarSenhaInput = z.infer<typeof atualizarSenhaSchema>;