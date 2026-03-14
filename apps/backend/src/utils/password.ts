import bcrypt from 'bcryptjs';

const BCRYPT_PREFIX = '$2';

export const isPasswordHash = (value?: string | null) => !!value && value.startsWith(BCRYPT_PREFIX);

export const hashPassword = async (plainPassword: string) => {
  return bcrypt.hash(plainPassword, 12);
};

export const verifyPassword = async (plainPassword: string, storedPassword?: string | null) => {
  if (!storedPassword) return false;
  if (isPasswordHash(storedPassword)) {
    return bcrypt.compare(plainPassword, storedPassword);
  }

  // Legacy fallback for existing plain-text rows. Caller should migrate on success.
  return plainPassword === storedPassword;
};
