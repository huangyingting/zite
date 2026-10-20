import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getConfiguredAIProvider,
  ZITE_MODEL_TIERS,
  type AIProviderId,
} from "@/lib/ai/provider";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  const provider = await getConfiguredAIProvider();
  const setting = await prisma.orgSetting.findUnique({
    where: { key: "ai_provider" },
  });
  const parsed = setting ? JSON.parse(setting.valueJson) : {};

  return NextResponse.json({
    activeProvider: provider,
    defaultModelTier: parsed.defaultModelTier || "zite-pro",
    copilotModel: parsed.copilotModel || process.env.COPILOT_MODEL || "gpt-4.1",
    azureEndpoint:
      parsed.azureEndpoint ||
      process.env.AZURE_OPENAI_ENDPOINT ||
      "https://your-resource.openai.azure.com",
    azureDeployment:
      parsed.azureDeployment || process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
    orgDefaultCreditLimit: parsed.orgDefaultCreditLimit ?? 400,
    requireMfa: parsed.requireMfa ?? true,
    availableProviders: [
      {
        id: "copilot-sdk",
        label: "GitHub Copilot SDK (@github/copilot-sdk)",
        status: "Ready (Default Pluggable Engine)",
      },
      {
        id: "azure-openai",
        label: "Azure OpenAI Service (GPT-4o / o3)",
        status: process.env.AZURE_OPENAI_API_KEY
          ? "Configured"
          : "Pluggable Adapter Ready (Fallback enabled)",
      },
      {
        id: "deterministic",
        label: "Zite Deterministic Synthesizer",
        status: "Built-in Local / CI Engine",
      },
    ],
    modelTiers: Object.values(ZITE_MODEL_TIERS),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Only admins can change organization AI provider settings" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    provider?: AIProviderId;
    defaultModelTier?: string;
    copilotModel?: string;
    azureEndpoint?: string;
    azureDeployment?: string;
    orgDefaultCreditLimit?: number;
    requireMfa?: boolean;
  };

  const existing = await prisma.orgSetting.findUnique({
    where: { key: "ai_provider" },
  });
  const current = existing ? JSON.parse(existing.valueJson) : {};

  const updated = {
    ...current,
    ...(body.provider ? { provider: body.provider } : {}),
    ...(body.defaultModelTier ? { defaultModelTier: body.defaultModelTier } : {}),
    ...(body.copilotModel ? { copilotModel: body.copilotModel } : {}),
    ...(body.azureEndpoint !== undefined ? { azureEndpoint: body.azureEndpoint } : {}),
    ...(body.azureDeployment !== undefined ? { azureDeployment: body.azureDeployment } : {}),
    ...(typeof body.orgDefaultCreditLimit === "number"
      ? { orgDefaultCreditLimit: body.orgDefaultCreditLimit }
      : {}),
    ...(typeof body.requireMfa === "boolean" ? { requireMfa: body.requireMfa } : {}),
  };

  await prisma.orgSetting.upsert({
    where: { key: "ai_provider" },
    create: { key: "ai_provider", valueJson: JSON.stringify(updated) },
    update: { valueJson: JSON.stringify(updated) },
  });

  if (typeof body.orgDefaultCreditLimit === "number") {
    await recordAuditLog({
      eventType: "org.creditLimitDefaultChange",
      category: "org",
      securityCritical: true,
      actorUserId: user.id,
      actorEmail: user.email,
      targetType: "organization",
      targetId: "org_ashgrove",
      targetName: "Ashgrove Software",
      payload: {
        from: current.orgDefaultCreditLimit ?? 400,
        to: body.orgDefaultCreditLimit,
      },
    });
  }

  if (typeof body.requireMfa === "boolean" && body.requireMfa !== current.requireMfa) {
    await recordAuditLog({
      eventType: "org.requireMfa",
      category: "org",
      securityCritical: true,
      actorUserId: user.id,
      actorEmail: user.email,
      targetType: "organization",
      targetId: "org_ashgrove",
      targetName: "Ashgrove Software",
      payload: { requireMfa: body.requireMfa },
    });
  }

  return NextResponse.json({ ok: true, config: updated });
}
