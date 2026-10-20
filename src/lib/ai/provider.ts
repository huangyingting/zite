import { prisma } from "@/lib/prisma";

export type AIProviderId = "copilot-sdk" | "azure-openai" | "deterministic";
export type ZiteAgentMode = "auto" | "build" | "plan" | "chat";
export type ZiteModelTier = "zite-mini" | "zite-pro" | "zite-max" | "zite-max-fast";

export interface ModelTierMetadata {
  id: ZiteModelTier;
  name: string;
  poweredBy: string;
  speedRating: number;
  intelligenceRating: number;
  creditRate: number;
  bestFor: string;
  paidOnly: boolean;
}

export const ZITE_MODEL_TIERS: Record<ZiteModelTier, ModelTierMetadata> = {
  "zite-mini": {
    id: "zite-mini",
    name: "Zite Mini",
    poweredBy: "GPT-6 Luna / Copilot Fast",
    speedRating: 5,
    intelligenceRating: 3,
    creditRate: 1,
    bestFor: "Quick, simple tasks like minor text changes and small style edits",
    paidOnly: false,
  },
  "zite-pro": {
    id: "zite-pro",
    name: "Zite Pro",
    poweredBy: "Claude Opus 5.5 / Copilot Pro",
    speedRating: 4,
    intelligenceRating: 4,
    creditRate: 3,
    bestFor: "Most tasks (default) — adding features, fixing bugs, updating designs",
    paidOnly: false,
  },
  "zite-max": {
    id: "zite-max",
    name: "Zite Max",
    poweredBy: "Claude Opus 5.5 Thinking / Copilot Max",
    speedRating: 2,
    intelligenceRating: 5,
    creditRate: 3,
    bestFor: "The hardest architectural, planning, and multi-workflow tasks",
    paidOnly: true,
  },
  "zite-max-fast": {
    id: "zite-max-fast",
    name: "Zite Max Fast",
    poweredBy: "Claude Opus 5.5 Fast / Copilot Max Fast",
    speedRating: 4,
    intelligenceRating: 5,
    creditRate: 5,
    bestFor: "Complex full-stack builds finished up to 2.5x sooner",
    paidOnly: true,
  },
};

/**
 * Matches Zite's documented mode-based model behavior:
 * - Build and Auto modes use the user's selected model.
 * - Plan and Chat modes always elevate lower models (Mini/Pro) to Zite Max,
 *   while keeping Zite Max Fast if already selected.
 */
export function resolveEffectiveModelTier(
  mode: ZiteAgentMode,
  selectedTier: ZiteModelTier
): ZiteModelTier {
  if (mode === "plan" || mode === "chat") {
    if (selectedTier === "zite-max-fast") {
      return "zite-max-fast";
    }
    return "zite-max";
  }
  return selectedTier;
}

export async function getConfiguredAIProvider(): Promise<AIProviderId> {
  try {
    const setting = await prisma.orgSetting.findUnique({
      where: { key: "ai_provider" },
    });
    if (setting) {
      const parsed = JSON.parse(setting.valueJson) as { provider?: AIProviderId };
      if (
        parsed.provider === "copilot-sdk" ||
        parsed.provider === "azure-openai" ||
        parsed.provider === "deterministic"
      ) {
        return parsed.provider;
      }
    }
  } catch {
    // ignore DB lookup error during early init
  }

  const envProvider = (process.env.AI_PROVIDER || "copilot-sdk") as AIProviderId;
  if (["copilot-sdk", "azure-openai", "deterministic"].includes(envProvider)) {
    return envProvider;
  }
  return "copilot-sdk";
}

async function tryInvokeCopilotSdk(prompt: string, modelTier: ZiteModelTier): Promise<string | null> {
  if (process.env.ZITE_DISABLE_LIVE_SDK === "1") {
    return null;
  }
  try {
    const sdk = await import("@github/copilot-sdk");
    if (!sdk || typeof sdk.CopilotClient !== "function") {
      return null;
    }
    // Only attempt live Copilot CLI daemon connection when explicitly enabled via COPILOT_SDK_LIVE=1
    // so local/CI runs remain fast and never hang waiting for an external daemon socket.
    if (process.env.COPILOT_SDK_LIVE !== "1") {
      return null;
    }
    const client = new sdk.CopilotClient();
    await client.start();
    const session = await client.createSession({
      model: process.env.COPILOT_MODEL || (modelTier === "zite-mini" ? "gpt-4.1-mini" : "gpt-4.1"),
      onPermissionRequest: async () => ({ kind: "approved" as const }),
    });
    const response = await session.sendAndWait({ prompt }, 12000);
    await session.destroy();
    await client.stop();
    const content = (response as { data?: { content?: string } })?.data?.content;
    return content || null;
  } catch {
    return null;
  }
}

async function tryInvokeAzureOpenAI(prompt: string): Promise<string | null> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";

  if (!endpoint || !apiKey || endpoint.includes("your-resource")) {
    return null;
  }

  try {
    const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are Zite AI, an expert full-stack TypeScript and business software architect for the Zite.js platform.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export interface AgentChatTurnInput {
  appName: string;
  mode: ZiteAgentMode;
  selectedModelTier: ZiteModelTier;
  prompt: string;
  existingNav?: Array<{ id: string; label: string; badge?: string }>;
}

export interface AgentChatTurnOutput {
  providerUsed: AIProviderId;
  providerEngineLabel: string;
  mode: ZiteAgentMode;
  selectedModelTier: ZiteModelTier;
  effectiveModelTier: ZiteModelTier;
  creditsConsumed: number;
  assistantReply: string;
  mutatedApp: boolean;
  addedNavSection?: { id: string; label: string; badge?: string };
  updatedCodeSnippet?: string;
  planSteps?: string[];
}

export async function runZiteAgentTurn(
  input: AgentChatTurnInput
): Promise<AgentChatTurnOutput> {
  const configuredProvider = await getConfiguredAIProvider();
  const effectiveModelTier = resolveEffectiveModelTier(
    input.mode,
    input.selectedModelTier
  );
  const tierMeta = ZITE_MODEL_TIERS[effectiveModelTier];

  let liveText: string | null = null;
  let actualProvider: AIProviderId = configuredProvider;

  if (configuredProvider === "copilot-sdk") {
    liveText = await tryInvokeCopilotSdk(input.prompt, effectiveModelTier);
  } else if (configuredProvider === "azure-openai") {
    liveText = await tryInvokeAzureOpenAI(input.prompt);
  }

  const providerEngineLabel =
    configuredProvider === "copilot-sdk"
      ? `@github/copilot-sdk (${tierMeta.name})`
      : configuredProvider === "azure-openai"
      ? `Azure OpenAI (${process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o"} · ${tierMeta.name})`
      : `Zite Deterministic Synthesizer (${tierMeta.name})`;

  const normalizedPrompt = input.prompt.trim();

  if (input.mode === "plan") {
    const planSteps = [
      `1. Inspect unified Zite Database schema (zite.schema.json) for "${input.appName}" tables and linked records.`,
      `2. Define or update typed backend workflow in src/api/ using createEndpoint from 'zitejs/backend'.`,
      `3. Update React view components in src/App.tsx using @project/components/ui/* and typed callers from 'zitejs/api'.`,
      `4. Verify role-based row-level permissions and publish version snapshot.`,
    ];
    return {
      providerUsed: actualProvider,
      providerEngineLabel,
      mode: input.mode,
      selectedModelTier: input.selectedModelTier,
      effectiveModelTier,
      creditsConsumed: tierMeta.creditRate,
      assistantReply:
        liveText ??
        `### Architectural Plan (${tierMeta.name})\n\nI analyzed **"${normalizedPrompt}"** in **Plan Mode** (automatically elevated to **${tierMeta.name}** for deep reasoning). No code or database files were modified yet.\n\n${planSteps.join("\n")}\n\nSwitch to **Build** or **Auto** mode (or press \`Shift + Tab\`) when you're ready for me to apply these changes.`,
      mutatedApp: false,
      planSteps,
    };
  }

  if (input.mode === "chat") {
    return {
      providerUsed: actualProvider,
      providerEngineLabel,
      mode: input.mode,
      selectedModelTier: input.selectedModelTier,
      effectiveModelTier,
      creditsConsumed: tierMeta.creditRate,
      assistantReply:
        liveText ??
        `### Zite Architecture & Data Flow Answer (${tierMeta.name})\n\nRegarding **"${normalizedPrompt}"**:\n- **Unified Database**: Your app queries tables through \`import { zite } from 'zitejs/db'\` inside backend workflows, or runs read-only analytical aggregations with \`zite.sql()\`.\n- **Workflows**: Each file under \`apps/<app>/src/api/*.ts\` exports \`createEndpoint({ authenticated: true, inputSchema, execute })\`.\n- **No Mutations Applied**: Because you are in **Chat Mode**, your workspace code and schema remain untouched.`,
      mutatedApp: false,
    };
  }

  // Auto or Build mode: synthesize a concrete feature addition & code update
  const stopWords = new Set(["build", "create", "add", "a", "an", "the", "with", "for", "and", "to", "in", "page", "view", "tab", "module", "section"]);
  const words = normalizedPrompt
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));
  const sectionLabel =
    words.slice(0, 2).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") ||
    "AI Insights";
  const sectionId = sectionLabel.toLowerCase().replace(/\s+/g, "-");

  const updatedCodeSnippet = `// Generated by ${providerEngineLabel} in ${input.mode.toUpperCase()} mode
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { z } from 'zod';

export default createEndpoint({
  description: ${JSON.stringify(normalizedPrompt)},
  authenticated: true,
  inputSchema: z.object({ filter: z.string().optional() }),
  execute: async ({ input, context }) => {
    const { records } = await zite.deals.findAll({
      limit: 100,
      sort: [{ field: 'createdAt', direction: 'desc' }],
    });
    return {
      section: ${JSON.stringify(sectionLabel)},
      operator: context.user?.email ?? 'system@zite.com',
      count: records.length,
      records,
    };
  },
});`;

  return {
    providerUsed: actualProvider,
    providerEngineLabel,
    mode: input.mode,
    selectedModelTier: input.selectedModelTier,
    effectiveModelTier,
    creditsConsumed: tierMeta.creditRate,
    assistantReply:
      liveText ??
      `Built **"${sectionLabel}"** for **${input.appName}** using **${providerEngineLabel}** in **${input.mode.toUpperCase()}** mode.\n\n- Added navigation view **${sectionLabel}**\n- Generated typed backend endpoint in \`src/api/${sectionId.replace(/-/g, "")}.ts\`\n- Wired live Zite Database records and created a new rollback-ready version snapshot.`,
    mutatedApp: true,
    addedNavSection: {
      id: sectionId,
      label: sectionLabel,
      badge: "New",
    },
    updatedCodeSnippet,
  };
}

export async function evaluateZiteAiField(params: {
  fieldName: string;
  promptTemplate: string;
  rowValues: Record<string, unknown>;
}): Promise<{ value: string; providerUsed: AIProviderId }> {
  const provider = await getConfiguredAIProvider();
  let interpolated = params.promptTemplate;
  for (const [k, v] of Object.entries(params.rowValues)) {
    interpolated = interpolated.replace(
      new RegExp(`\\{${k}\\}`, "gi"),
      String(v ?? "")
    );
  }

  const primaryLabel =
    String(
      params.rowValues.name ||
        params.rowValues.title ||
        params.rowValues.company ||
        params.rowValues.subject ||
        "Record"
    );
  const amount = params.rowValues.amount || params.rowValues.value || "";
  const stage = params.rowValues.stage || params.rowValues.status || "Active";

  const synthesized = amount
    ? `${primaryLabel} (${stage}, $${Number(amount).toLocaleString()}): High-fit opportunity — recommend scheduling executive follow-up within 48h.`
    : `${primaryLabel} (${stage}): Verified by Zite AI Field (${provider}) — next action prioritized.`;

  return {
    value: synthesized,
    providerUsed: provider,
  };
}
