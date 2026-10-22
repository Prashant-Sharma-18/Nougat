import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

// Ensure 32-byte (256-bit) encryption key
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || "nougat_default_secure_vault_key_32chars!";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts sensitive text (e.g., gift card voucher codes, PINs) using AES-256-GCM.
 * Output format: iv:authTag:encryptedHex
 */
export function encryptSensitiveData(plainText: string | null | undefined): string | null {
  if (!plainText) return null;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to securely encrypt sensitive card voucher data.");
  }
}

/**
 * Decrypts AES-256-GCM encrypted sensitive text.
 */
export function decryptSensitiveData(encryptedString: string | null | undefined): string | null {
  if (!encryptedString) return null;

  // If the string does not match the encrypted format (e.g., legacy unencrypted card code), return as is
  if (!encryptedString.includes(":") || encryptedString.split(":").length !== 3) {
    return encryptedString;
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedString.split(":");
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return "[Decryption Error: Invalid Key or Corrupted Ciphertext]";
  }
}

