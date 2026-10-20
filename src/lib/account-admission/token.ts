import crypto from "crypto";

export function generateInvitationToken(): string {
  return `zite_inv_${crypto.randomBytes(24).toString("base64url")}`;
}

export function hashInvitationToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
