import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInvitation, type ZiteRole } from "@/lib/account-admission/invitations";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  const invitations = await prisma.accountInvitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy: { select: { id: true, email: true, name: true } },
      acceptedBy: { select: { id: true, email: true, name: true } },
    },
  });

  return NextResponse.json({ invitations });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      role?: ZiteRole;
      expiresInHours?: number;
    };

    if (!body.email || !body.email.includes("@")) {
      return NextResponse.json({ error: "Valid email address is required." }, { status: 400 });
    }

    const result = await createInvitation({
      email: body.email,
      role: body.role || "VIEWER",
      expiresInHours: body.expiresInHours ?? 72,
      invitedByUserId: user.id,
      invitedByEmail: user.email,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create invitation" },
      { status: 400 }
    );
  }
}
