import crypto from 'crypto';

const buildSecretKey = () => {
  const secret = process.env.HISTORY_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('HISTORY_ENCRYPTION_KEY (or JWT_SECRET) is required for password history encryption');
  }
  return crypto.createHash('sha256').update(secret).digest();
};

export const encryptHistoryPassword = (plainPassword) => {
  const key = buildSecretKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plainPassword), 'utf8'),
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
  const key = buildSecretKey();
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPassword, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};
