import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user']).default('user'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});