/** Dados do perfil da conta logada (sem senhaHash) — compartilhado entre a
 *  página server (`/perfil`) e os componentes client do perfil. */
export type PerfilDados = {
  id: string;
  nome: string;
  idade: number | null;
  generosLiterarios: string[];
  nomeAutor: string | null;
  fotoUrl: string | null;
  username: string;
  email: string;
  telefone: string | null;
  bio: string | null;
  site: string | null;
  criadoEm: string; // ISO
};