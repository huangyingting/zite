import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  const brandKits = await prisma.brandKit.findMany({
    orderBy: { updatedAt: "desc" },
  });
  const kits = brandKits.map((k, idx) => ({
    ...k,
    sourceUrl: k.sourceWebsiteUrl,
    isDefault: idx === 0,
  }));
  return NextResponse.json({ brandKits: kits, kits });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role === "VIEWER") {
    return NextResponse.json(
      { error: "Forbidden: Viewer role cannot edit Brand Kits" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    id?: string;
    workspaceId?: string;
    action?: "save" | "extract_from_url";
    websiteUrl?: string;
    sourceUrl?: string;
    name?: string;
    logoText?: string;
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    headingFont?: string;
    bodyFont?: string;
    borderRadius?: string;
    toneOfVoice?: string;
  };

  const targetWs =
    (body.workspaceId
      ? await prisma.workspace.findFirst({
          where: {
            OR: [{ id: body.workspaceId }, { publicId: body.workspaceId }],
          },
        })
      : null) || (await prisma.workspace.findFirst());

  if (!targetWs) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const rawUrl = body.websiteUrl || body.sourceUrl;

  if ((body.action === "extract_from_url" || rawUrl) && rawUrl && !body.id) {
    const url = rawUrl.trim().toLowerCase();
    const isStripe = url.includes("stripe");
    const isLinear = url.includes("linear");
    const extracted = {
      name:
        body.name ||
        (isStripe
          ? "Stripe FinTech Palette"
          : isLinear
          ? "Linear Precision Dark"
          : `Brand Kit (${url.replace(/^https?:\/\//, "").split("/")[0]})`),
      primaryColor:
        body.primaryColor || (isStripe ? "#635BFF" : isLinear ? "#5E6AD2" : "#0F766E"),
      accentColor:
        body.accentColor || (isStripe ? "#00D4B6" : isLinear ? "#26B5CE" : "#2563EB"),
      backgroundColor: body.backgroundColor || "#FAF9F5",
      textColor: body.textColor || "#141413",
      headingFont: body.headingFont || "Georgia",
      bodyFont: body.bodyFont || "Inter",
      borderRadius: body.borderRadius || "10px",
      toneOfVoice:
        body.toneOfVoice ||
        `Extracted from ${rawUrl} — Crisp, modern, high-trust product voice`,
      sourceWebsiteUrl: rawUrl,
    };

    const kit = await prisma.brandKit.create({
      data: {
        workspaceId: targetWs.id,
        ...extracted,
      },
    });

    await recordAuditLog({
      eventType: "brandKit.extract",
      category: "app",
      actorUserId: user.id,
      actorEmail: user.email,
      targetType: "brandKit",
      targetId: kit.id,
      targetName: kit.name,
      payload: { sourceUrl: rawUrl, primaryColor: kit.primaryColor },
    });

    const normalized = { ...kit, sourceUrl: kit.sourceWebsiteUrl, isDefault: true };
    return NextResponse.json(
      { brandKit: normalized, kit: normalized, extracted: true },
      { status: 201 }
    );
  }

  if (body.id) {
    const kit = await prisma.brandKit.update({
      where: { id: body.id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.logoText ? { logoText: body.logoText } : {}),
        ...(body.primaryColor ? { primaryColor: body.primaryColor } : {}),
        ...(body.accentColor ? { accentColor: body.accentColor } : {}),
        ...(body.backgroundColor ? { backgroundColor: body.backgroundColor } : {}),
        ...(body.textColor ? { textColor: body.textColor } : {}),
        ...(body.headingFont ? { headingFont: body.headingFont } : {}),
        ...(body.bodyFont ? { bodyFont: body.bodyFont } : {}),
        ...(body.borderRadius ? { borderRadius: body.borderRadius } : {}),
        ...(body.toneOfVoice ? { toneOfVoice: body.toneOfVoice } : {}),
      },
    });
    const normalized = { ...kit, sourceUrl: kit.sourceWebsiteUrl };
    return NextResponse.json({ brandKit: normalized, kit: normalized });
  }

  const kit = await prisma.brandKit.create({
    data: {
      workspaceId: targetWs.id,
      name: body.name || "Custom Brand Kit",
      primaryColor: body.primaryColor || "#2563EB",
      accentColor: body.accentColor || "#059669",
      backgroundColor: body.backgroundColor || "#FAF9F5",
      headingFont: body.headingFont || "Georgia",
      bodyFont: body.bodyFont || "Inter",
      borderRadius: body.borderRadius || "10px",
    },
  });
  const normalized = { ...kit, sourceUrl: kit.sourceWebsiteUrl, isDefault: true };
  return NextResponse.json({ brandKit: normalized, kit: normalized }, { status: 201 });
}
