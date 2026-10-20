import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  const [users, groups] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        sessionVersion: true,
        aiCreditLimit: true,
        aiCreditsUsed: true,
        createdByAdminBootstrap: true,
        lastLoginAt: true,
        revokedAt: true,
        createdAt: true,
      },
    }),
    prisma.userGroup.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return NextResponse.json({ users, groups });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    members?: string[];
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Group name is required" }, { status: 400 });
  }

  const group = await prisma.userGroup.create({
    data: {
      name: body.name.trim(),
      description: body.description?.trim() || "",
      membersJson: JSON.stringify(body.members ?? []),
      permissionsJson: JSON.stringify({ access: "read_write" }),
    },
  });

  await recordAuditLog({
    eventType: "group.create",
    category: "org",
    actorUserId: user.id,
    actorEmail: user.email,
    targetType: "group",
    targetId: group.id,
    targetName: group.name,
    payload: { membersCount: (body.members ?? []).length },
  });

  return NextResponse.json({ group }, { status: 201 });
}
