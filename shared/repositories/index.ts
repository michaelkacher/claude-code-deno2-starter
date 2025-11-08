/**
 * Repository Pattern for Deno KV
 * 
 * Centralized data access layer providing:
 * - Type-safe CRUD operations
 * - Transaction support
 * - Consistent error handling
 * - Logging and monitoring
 * 
 * Usage:
 * ```typescript
 * import { UserRepository, TokenRepository } from './repositories/index.ts';
 * 
 * const userRepo = new UserRepository();
 * const user = await userRepo.findByEmail('user@example.com');
 * ```
 */

export { BaseRepository } from './base-repository.ts';
export type { ListOptions, ListResult, RepositoryOptions } from './base-repository.ts';

export { UserRepository } from './user-repository.ts';

export { TokenRepository } from './token-repository.ts';
export type {
    BlacklistTokenData,
    EmailVerificationTokenData,
    PasswordResetTokenData,
    RefreshTokenData
} from './token-repository.ts';

export { NotificationRepository } from './notification-repository.ts';
export type { NotificationQueryOptions } from './notification-repository.ts';

export { JobRepository } from './job-repository.ts';
export type { JobQueryOptions } from './job-repository.ts';

// Import for factory use
import { JobRepository } from './job-repository.ts';
import { NotificationRepository } from './notification-repository.ts';
import { TokenRepository } from './token-repository.ts';
import { UserRepository } from './user-repository.ts';

/**
 * Repository factory for dependency injection
 * Useful for testing with custom KV instances
 */
export class RepositoryFactory {
  constructor(private kv?: Deno.Kv) {}

  createUserRepository() {
    return new UserRepository({ kv: this.kv });
  }

  createTokenRepository() {
    return new TokenRepository({ kv: this.kv });
  }

  createNotificationRepository() {
    return new NotificationRepository({ kv: this.kv });
  }

  createJobRepository() {
    return new JobRepository({ kv: this.kv });
  }
}
