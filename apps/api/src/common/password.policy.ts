import { z } from 'zod';

/** ollaiBooks password policy: at least 8 characters with a letter and a number. */
export const PASSWORD_MIN_LENGTH = 8;
export const PasswordSchema = z.string()
  .min(PASSWORD_MIN_LENGTH, 'Password must be at least 8 characters')
  .max(200)
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/\d/, 'Password must include a number');
