import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const resolveSecret = () => {
  const secret =
    process.env.HISTORY_PASSWORD_SECRET ||
    process.env.HISTORY_PASSWORD_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'dev-history-password-secret-change-me';

  return String(secret);
};

const getKey = () => {
  return crypto.createHash('sha256').update(resolveSecret()).digest();
};

export const encryptHistoryPassword = (plainText) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedPassword: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
};

export const decryptHistoryPassword = ({ encryptedPassword, iv, authTag }) => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(String(iv), 'base64')
  );

  decipher.setAuthTag(Buffer.from(String(authTag), 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(String(encryptedPassword), 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};
