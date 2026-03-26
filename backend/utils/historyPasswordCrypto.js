import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

let hasWarnedForFallbackKey = false;

const resolveRawSecret = () => {
  const candidate =
    process.env.HISTORY_PASSWORD_ENCRYPTION_KEY ||
    process.env.HISTORY_PASSWORD_SECRET ||
    process.env.JWT_SECRET ||
    '';

  if (!candidate && !hasWarnedForFallbackKey) {
    hasWarnedForFallbackKey = true;
    console.warn(
      '[historyPasswordCrypto] No HISTORY_PASSWORD_ENCRYPTION_KEY/HISTORY_PASSWORD_SECRET/JWT_SECRET set. Using development fallback key.'
    );
  }

  return candidate || 'development-history-password-secret-change-me';
};

const getKey = () => {
  const rawSecret = resolveRawSecret();
  return crypto.createHash('sha256').update(String(rawSecret)).digest();
};

export const encryptHistoryPassword = (plainPassword) => {
  if (typeof plainPassword !== 'string' || plainPassword.length === 0) {
    throw new Error('Password is required for encryption');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(plainPassword, 'utf8'),
    cipher.final(),
  ]);

  return {
    encryptedPassword: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
};

export const decryptHistoryPassword = ({ encryptedPassword, iv, authTag }) => {
  if (!encryptedPassword || !iv || !authTag) {
    throw new Error('Encrypted payload is incomplete');
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPassword, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};
