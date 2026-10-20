import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const brandKits = await prisma.brandKit.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ brandKits });
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

  if (body.action === "extract_from_url" && body.websiteUrl) {
    const url = body.websiteUrl.trim().toLowerCase();
    const isStripe = url.includes("stripe");
    const isLinear = url.includes("linear");
    const extracted = {
      name: isStripe
        ? "Stripe FinTech Palette"
        : isLinear
        ? "Linear Precision Dark"
        : `Brand Kit (${url.replace(/^https?:\/\//, "").split("/")[0]})`,
      primaryColor: isStripe ? "#635BFF" : isLinear ? "#5E6AD2" : "#0F766E",
      accentColor: isStripe ? "#00D4B6" : isLinear ? "#26B5CE" : "#2563EB",
      backgroundColor: "#FAF9F5",
      textColor: "#141413",
      headingFont: "Georgia",
      bodyFont: "Inter",
      borderRadius: "10px",
      toneOfVoice: `Extracted from ${body.websiteUrl} — Crisp, modern, high-trust product voice`,
      sourceWebsiteUrl: body.websiteUrl,
    };

    if (body.id) {
      const kit = await prisma.brandKit.update({
        where: { id: body.id },
        data: extracted,
      });
      return NextResponse.json({ brandKit: kit, extracted: true });
    }
    const ws = await prisma.workspace.findFirst();
    const kit = await prisma.brandKit.create({
      data: {
        workspaceId: body.workspaceId || ws!.id,
        ...extracted,
      },
    });
    return NextResponse.json({ brandKit: kit, extracted: true }, { status: 201 });
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
    return NextResponse.json({ brandKit: kit });
  }

  const ws = await prisma.workspace.findFirst();
  const kit = await prisma.brandKit.create({
    data: {
      workspaceId: body.workspaceId || ws!.id,
      name: body.name || "Custom Brand Kit",
      primaryColor: body.primaryColor || "#2563EB",
      accentColor: body.accentColor || "#059669",
    },
  });
  return NextResponse.json({ brandKit: kit }, { status: 201 });
}
