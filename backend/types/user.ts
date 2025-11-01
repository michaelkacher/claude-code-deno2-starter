import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user']).default('user'),
  emailVerified: z.boolean().default(false),
  emailVerifiedAt: z.string().datetime().nullable().default(null),
  twoFactorEnabled: z.boolean().default(false),
  twoFactorSecret: z.string().nullable().default(null),
  twoFactorBackupCodes: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({ 
  id: true, 
  role: true,
  emailVerified: true,
  emailVerifiedAt: true,
  twoFactorEnabled: true,
  twoFactorSecret: true,
  twoFactorBackupCodes: true,
  createdAt: true, 
  updatedAt: true 
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});