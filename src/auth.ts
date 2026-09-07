import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators/autenticacao";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        login: { label: "Email ou usuário", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credenciais) {
        const validacao = loginSchema.safeParse(credenciais);
        if (!validacao.success) return null;

        const { login, senha } = validacao.data;
        const identificador = login.toLowerCase().trim();

        const usuario = await prisma.usuario.findFirst({
          where: {
            OR: [{ email: identificador }, { username: identificador }],
          },
        });
        if (!usuario) return null;

        const senhaOk = await bcrypt.compare(senha, usuario.senhaHash);
        if (!senhaOk) return null;

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          // username não faz parte do tipo User do Auth.js; repassamos no token
          username: usuario.username,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | undefined;
      }
      return session;
    },
  },
});