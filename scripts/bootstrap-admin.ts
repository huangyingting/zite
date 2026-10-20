#!/usr/bin/env tsx
import "dotenv/config";
import readline from "readline";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/account-admission/password";
import { normalizeEmail } from "../src/lib/account-admission/token";
import { recordAuditLog } from "../src/lib/audit";

function parseArgs(argv: string[]) {
  let email = "";
  let name = "Zite Bootstrap Admin";
  let passwordStdin = false;
  let password = "";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--email" && argv[i + 1]) {
      email = argv[++i];
    } else if (arg.startsWith("--email=")) {
      email = arg.slice("--email=".length);
    } else if (arg === "--name" && argv[i + 1]) {
      name = argv[++i];
    } else if (arg.startsWith("--name=")) {
      name = arg.slice("--name=".length);
    } else if (arg === "--password-stdin") {
      passwordStdin = true;
    } else if (arg === "--password" && argv[i + 1]) {
      password = argv[++i];
    }
  }

  return { email, name, passwordStdin, password };
}

async function readStdinLine(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });
    rl.on("line", (line) => {
      if (!data) data = line;
    });
    rl.on("close", () => resolve(data.trim()));
    rl.on("error", reject);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.email) {
    console.error(
      "Usage: npm run bootstrap:admin -- --email <email> [--name <name>] --password-stdin"
    );
    process.exit(1);
  }

  const email = normalizeEmail(args.email);
  const password = args.passwordStdin ? await readStdinLine() : args.password;

  if (!password || password.length < 8) {
    console.error("Error: Bootstrap admin password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  const existing = await prisma.user.findUnique({ where: { email } });
  let user;

  if (existing) {
    user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: args.name || existing.name || "Zite Admin",
        role: "ADMIN",
        status: "ACTIVE",
        revokedAt: null,
        createdByAdminBootstrap: true,
        sessionVersion: { increment: 1 },
      },
    });
    await prisma.passwordCredential.upsert({
      where: { userId: existing.id },
      create: { userId: existing.id, passwordHash, passwordUpdatedAt: now },
      update: { passwordHash, passwordUpdatedAt: now },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: args.name,
        role: "ADMIN",
        status: "ACTIVE",
        createdByAdminBootstrap: true,
        passwordCredential: {
          create: {
            passwordHash,
            passwordUpdatedAt: now,
          },
        },
      },
    });
  }

  await recordAuditLog({
    eventType: "user.roleChange",
    category: "user",
    securityCritical: true,
    actorUserId: user.id,
    actorEmail: user.email,
    targetType: "user",
    targetId: user.id,
    targetName: user.email,
    payload: {
      bootstrapCli: true,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(
    JSON.stringify({
      ok: true,
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdByAdminBootstrap: user.createdByAdminBootstrap,
    })
  );
}

main()
  .catch((err) => {
    console.error("Bootstrap admin error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
