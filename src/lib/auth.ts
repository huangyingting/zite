import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/account-admission/password";
import { normalizeEmail } from "@/lib/account-admission/token";
import { recordAuditLog } from "@/lib/audit";
import type { ZiteRole } from "@/lib/account-admission/invitations";

export interface AuthenticatedZiteUser {
  id: string;
  email: string;
  name: string;
  role: ZiteRole;
  status: string;
  sessionVersion: number;
  aiCreditLimit: number;
  aiCreditsUsed: number;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = normalizeEmail(credentials.email);
        const user = await prisma.user.findUnique({
          where: { email },
          include: { passwordCredential: true },
        });

        if (!user || !user.passwordCredential) {
          await recordAuditLog({
            eventType: "auth.login.failure",
            category: "auth",
            securityCritical: true,
            actorEmail: email,
            outcome: "FAILURE",
            payload: { email, reason: "User or password credential not found" },
          });
          return null;
        }

        if (user.status !== "ACTIVE") {
          await recordAuditLog({
            eventType: "auth.login.failure",
            category: "auth",
            securityCritical: true,
            actorUserId: user.id,
            actorEmail: email,
            outcome: "FAILURE",
            payload: { email, reason: `Account status is ${user.status}` },
          });
          throw new Error("AccountRevoked");
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.passwordCredential.passwordHash
        );
        if (!isValid) {
          await recordAuditLog({
            eventType: "auth.login.failure",
            category: "auth",
            securityCritical: true,
            actorUserId: user.id,
            actorEmail: email,
            outcome: "FAILURE",
            payload: { email, reason: "Invalid password" },
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await recordAuditLog({
          eventType: "auth.login.success",
          category: "auth",
          securityCritical: true,
          actorUserId: user.id,
          actorEmail: user.email,
          targetType: "user",
          targetId: user.id,
          targetName: user.email,
          payload: { method: "password", role: user.role },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email.split("@")[0],
          role: user.role,
          status: user.status,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as AuthenticatedZiteUser;
        token.sub = u.id;
        token.email = u.email;
        token.name = u.name;
        token.role = u.role;
        token.status = u.status;
        token.sessionVersion = u.sessionVersion;
        return token;
      }

      if (!token.sub) {
        return { ...token, revoked: true };
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: String(token.sub) },
      });

      if (
        !dbUser ||
        dbUser.status !== "ACTIVE" ||
        (typeof token.sessionVersion === "number" &&
          dbUser.sessionVersion !== token.sessionVersion)
      ) {
        return { ...token, revoked: true };
      }

      token.role = dbUser.role;
      token.status = dbUser.status;
      token.name = dbUser.name ?? dbUser.email;
      token.sessionVersion = dbUser.sessionVersion;
      return token;
    },
    async session({ session, token }) {
      if ((token as { revoked?: boolean }).revoked || !token.sub) {
        return { ...session, user: undefined } as unknown as typeof session;
      }
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).id = token.sub;
        (session.user as unknown as Record<string, unknown>).role = token.role ?? "VIEWER";
        (session.user as unknown as Record<string, unknown>).status = token.status ?? "ACTIVE";
        (session.user as unknown as Record<string, unknown>).sessionVersion =
          token.sessionVersion ?? 1;
      }
      return session;
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ??
    "zite-super-secret-jwt-signing-key-for-local-dev-2026",
};

export async function getCurrentUser(): Promise<AuthenticatedZiteUser | null> {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as unknown as
    | { id?: string; sessionVersion?: number }
    | undefined;
  if (!sessionUser?.id) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
  });

  if (!dbUser || dbUser.status !== "ACTIVE") {
    return null;
  }

  if (
    typeof sessionUser.sessionVersion === "number" &&
    dbUser.sessionVersion !== sessionUser.sessionVersion
  ) {
    return null;
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name ?? dbUser.email.split("@")[0],
    role: dbUser.role as ZiteRole,
    status: dbUser.status,
    sessionVersion: dbUser.sessionVersion,
    aiCreditLimit: dbUser.aiCreditLimit,
    aiCreditsUsed: dbUser.aiCreditsUsed,
  };
}
