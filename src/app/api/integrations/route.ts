import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const integrations = await prisma.workspaceIntegration.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ integrations });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role === "VIEWER") {
    return NextResponse.json(
      { error: "Forbidden: Viewer role cannot modify workspace integrations or secrets" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    providerId: string;
    name: string;
    category?: string;
    secretValue?: string;
    status?: "CONNECTED" | "DISCONNECTED";
  };

  const ws = await prisma.workspace.findFirst();
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const existing = await prisma.workspaceIntegration.findFirst({
    where: { workspaceId: ws.id, providerId: body.providerId },
  });

  const masked = body.secretValue
    ? `${body.secretValue.slice(0, 6)}••••••••••••`
    : existing?.secretMasked || "zite_sec_••••••••••••";

  if (existing) {
    const updated = await prisma.workspaceIntegration.update({
      where: { id: existing.id },
      data: {
        status: body.status || "CONNECTED",
        secretMasked: masked,
      },
    });
    return NextResponse.json({ integration: updated });
  }

  const created = await prisma.workspaceIntegration.create({
    data: {
      workspaceId: ws.id,
      providerId: body.providerId,
      name: body.name,
      category: body.category || "Integration",
      status: "CONNECTED",
      secretMasked: masked,
    },
  });

  return NextResponse.json({ integration: created }, { status: 201 });
}
