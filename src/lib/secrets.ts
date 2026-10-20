import crypto from "crypto";

const SECRET_KEY_MATERIAL =
  process.env.ZITE_SECRETS_KEY ||
  process.env.NEXTAUTH_SECRET ||
  "zite-super-secret-jwt-signing-key-for-local-dev-2026";

function deriveAesKey(): Buffer {
  return crypto.scryptSync(SECRET_KEY_MATERIAL, "zite-workspace-secrets-salt-v1", 32);
}

export function maskSecretValue(plainText: string): string {
  const trimmed = plainText.trim();
  if (trimmed.length <= 4) {
    return "••••••••••••";
  }
  return `${trimmed.slice(0, 4)}••••••••••••`;
}

export function encryptWorkspaceSecret(plainText: string): {
  storedValue: string;
  maskedPreview: string;
} {
  const maskedPreview = maskSecretValue(plainText);
  const iv = crypto.randomBytes(12);
  const key = deriveAesKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const storedValue = `enc:v1:${iv.toString("hex")}:${authTag.toString(
    "hex"
  )}:${encrypted.toString("hex")}:::${maskedPreview}`;

  return { storedValue, maskedPreview };
}

export function getMaskedSecretPreview(storedValue?: string | null): string {
  if (!storedValue) return "zite_sec_••••••••••••";
  if (storedValue.startsWith("enc:v1:") && storedValue.includes(":::")) {
    return storedValue.split(":::")[1] || "••••••••••••";
  }
  return storedValue;
}

export function decryptWorkspaceSecret(storedValue?: string | null): string | null {
  if (!storedValue) return null;
  if (!storedValue.startsWith("enc:v1:")) {
    return null;
  }
  try {
    const [envelope] = storedValue.split(":::");
    const parts = envelope.split(":");
    if (parts.length !== 5) return null;
    const iv = Buffer.from(parts[2], "hex");
    const authTag = Buffer.from(parts[3], "hex");
    const encrypted = Buffer.from(parts[4], "hex");

    const key = deriveAesKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export type ZiteErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class ZiteError extends Error {
  public readonly code: ZiteErrorCode;
  public readonly statusCode: number;

  constructor(code: ZiteErrorCode, message: string) {
    super(message);
    this.name = "ZiteError";
    this.code = code;
    const map: Record<ZiteErrorCode, number> = {
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      RATE_LIMITED: 429,
      INTERNAL_ERROR: 500,
    };
    this.statusCode = map[code] || 500;
  }
}
