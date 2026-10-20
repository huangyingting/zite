import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConfiguredAIProvider } from "@/lib/ai/provider";

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const [workspaceCount, userCount] = await Promise.all([
      prisma.workspace.count(),
      prisma.user.count(),
    ]);
    const aiProvider = getConfiguredAIProvider();

    return NextResponse.json({
      status: "healthy",
      version: "1.0.0",
      database: {
        status: "connected",
        latencyMs: Date.now() - startedAt,
        workspaces: workspaceCount,
        users: userCount,
      },
      ai: {
        activeProvider: aiProvider,
        copilotModel: process.env.COPILOT_MODEL || "gpt-4.1",
        azureConfigured: Boolean(
          process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY
        ),
      },
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: {
          status: "disconnected",
          error: error instanceof Error ? error.message : "Database check failed",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
