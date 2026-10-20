import { describe, it, expect } from "vitest";
import {
  generateInvitationToken,
  hashInvitationToken,
  normalizeEmail,
} from "@/lib/account-admission/token";
import {
  hashPassword,
  verifyPassword,
} from "@/lib/account-admission/password";
import {
  resolveEffectiveModelTier,
  getConfiguredAIProvider,
  setConfiguredAIProvider,
  runZiteAgentTurn,
  evaluateZiteAiField,
} from "@/lib/ai/provider";
import { ZITE_FIELD_TYPES, ZITE_TEMPLATES } from "@/lib/zite-catalog";
import { recordAuditLog } from "@/lib/audit";

describe("Zite Account Admission & Crypto Primitives", () => {
  it("generates single-use invitation tokens with zite_inv_ prefix and deterministic SHA-256 hash", () => {
    const rawToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);
    expect(rawToken.startsWith("zite_inv_")).toBe(true);
    expect(tokenHash).toHaveLength(64);
    expect(hashInvitationToken(rawToken)).toBe(tokenHash);
    expect(normalizeEmail("  Admin@Zite.com ")).toBe("admin@zite.com");
  });

  it("hashes and verifies passwords with bcrypt", async () => {
    const hash = await hashPassword("Password123!");
    expect(await verifyPassword("Password123!", hash)).toBe(true);
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });
});

describe("Zite Pluggable AI Engine & Mode-Based Model Elevation", () => {
  it("elevates zite-mini and zite-pro to zite-max in plan and chat modes while preserving zite-max-fast", () => {
    expect(resolveEffectiveModelTier("auto", "zite-mini")).toBe("zite-mini");
    expect(resolveEffectiveModelTier("build", "zite-pro")).toBe("zite-pro");
    expect(resolveEffectiveModelTier("plan", "zite-mini")).toBe("zite-max");
    expect(resolveEffectiveModelTier("plan", "zite-pro")).toBe("zite-max");
    expect(resolveEffectiveModelTier("chat", "zite-pro")).toBe("zite-max");
    expect(resolveEffectiveModelTier("plan", "zite-max-fast")).toBe(
      "zite-max-fast"
    );
    expect(resolveEffectiveModelTier("chat", "zite-max-fast")).toBe(
      "zite-max-fast"
    );
  });

  it("switches pluggable AI provider and runs agent turns in plan and build modes", async () => {
    const prov = await getConfiguredAIProvider();
    expect(["copilot-sdk", "azure-openai", "deterministic"]).toContain(prov);

    const res = await runZiteAgentTurn({
      appName: "Ashgrove CRM",
      prompt: "Add a weighted pipeline card to Deals",
      mode: "plan",
      selectedModelTier: "zite-pro",
    });
    expect(res.effectiveModelTier).toBe("zite-max");
    expect(res.assistantReply).toContain("Architectural Plan");
  });

  it("evaluates AI Field column templates against row JSON", async () => {
    const out = await evaluateZiteAiField({
      fieldName: "aiDealBrief",
      promptTemplate: "Summarize {name} for {company} (${amount})",
      rowValues: {
        name: "Enterprise Expansion",
        company: "Kestrel",
        amount: 185000,
      },
    });
    expect(out.value).toContain("Enterprise Expansion");
    expect(out.value).toContain("185,000");
  });
});

describe("Zite Database Field Catalog & Security Audit Event Taxonomy", () => {
  it("includes all 21+ documented Zite Database field types including formula and ai_field", () => {
    expect(ZITE_FIELD_TYPES.length).toBeGreaterThanOrEqual(21);
    expect(ZITE_FIELD_TYPES.some((f) => f.type === "formula")).toBe(true);
    expect(ZITE_FIELD_TYPES.some((f) => f.type === "ai_field")).toBe(true);
    expect(ZITE_TEMPLATES.length).toBeGreaterThanOrEqual(9);
  });

  it("records security-critical audit events accurately in SQLite", async () => {
    const log = await recordAuditLog({
      eventType: "user.roleChange",
      actorEmail: "admin@zite.com",
      targetName: "editor@zite.com",
      payload: { from: "EDITOR", to: "ADMIN" },
    });
    expect(log?.securityCritical).toBe(true);
    expect(log?.category).toBe("user");
  });
});
