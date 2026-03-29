import crypto from "crypto";

const ENCRYPTION_PREFIX = "ORBIT_ENC_V1";

function getEncryptionSecret() {
  const secret = process.env.AI_CONFIG_ENCRYPTION_SECRET || process.env.BETTER_AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "Missing encryption secret. Set AI_CONFIG_ENCRYPTION_SECRET (recommended) or BETTER_AUTH_SECRET (min 32 chars)."
    );
  }

  return secret;
}

function deriveKey(secret, salt) {
  return crypto.scryptSync(secret, salt, 32);
}

export function isEncryptedSecret(value) {
  return typeof value === "string" && value.startsWith(`${ENCRYPTION_PREFIX}:`);
}

export function encryptSecret(plaintext) {
  if (!plaintext) return plaintext;

  if (isEncryptedSecret(plaintext)) {
    return plaintext;
  }

  const secret = getEncryptionSecret();
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(secret, salt);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    salt.toString("base64"),
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptSecret(payload) {
  if (!payload) return payload;

  if (!isEncryptedSecret(payload)) {
    return payload;
  }

  const secret = getEncryptionSecret();
  const parts = payload.split(":");

  if (parts.length !== 5 || parts[0] !== ENCRYPTION_PREFIX) {
    throw new Error("Invalid encrypted secret format.");
  }

  const salt = Buffer.from(parts[1], "base64");
  const iv = Buffer.from(parts[2], "base64");
  const authTag = Buffer.from(parts[3], "base64");
  const ciphertext = Buffer.from(parts[4], "base64");
  const key = deriveKey(secret, salt);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
