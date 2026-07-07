import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          throw new Error("Usuário e senha são obrigatórios.");
        }

        const normalizedLogin = credentials.login.toLowerCase().trim();

        // Busca o funcionário pelo email (ou login) no PostgreSQL
        const user = await prisma.user.findFirst({
          where: {
            email: normalizedLogin,
          },
        });

        if (!user) {
          throw new Error("Funcionário não cadastrado com este e-mail.");
        }

        // Valida se a senha corresponde ao hash bcrypt salvo no banco
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Senha incorreta.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role, // ENUM: admin, manager, seller
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // Sessão expira em 24 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/admin", // Direciona para o login administrativo do site
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
