import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const body = (await request.json()) as { domain?: string };
  const raw = (body.domain || "").trim().toLowerCase();
  const domain = raw.includes("@") ? raw.split("@")[1] : raw;

  if (!domain || !domain.includes(".")) {
    return NextResponse.json(
      { error: "Valid company domain or work email is required." },
      { status: 400 }
    );
  }

  const orgSetting = await prisma.orgSetting.findUnique({
    where: { key: "ai_provider" },
  });
  const parsed = orgSetting ? JSON.parse(orgSetting.valueJson) : {};

  await recordAuditLog({
    eventType: "auth.sso.discovery",
    category: "auth",
    securityCritical: true,
    actorEmail: raw,
    targetType: "organization",
    targetId: "org_ashgrove",
    targetName: domain,
    payload: {
      domain,
      protocol: "SAML 2.0 / OIDC",
      requireMfa: parsed.requireMfa ?? true,
    },
  });

  return NextResponse.json({
    ok: true,
    domain,
    protocol: "SAML 2.0 / OIDC",
    idpName: domain.includes("ashgrove") || domain.includes("zite")
      ? "Okta Workforce Identity (Ashgrove Enterprise)"
      : `Enterprise OIDC Federation (${domain})`,
    requireMfa: parsed.requireMfa ?? true,
  });
}
