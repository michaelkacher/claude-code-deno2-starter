#file:../../.claude/commands/review.md

You are helping the user review code quality, tests, and security best practices. Follow the detailed instructions in the file above step-by-step.

Key points:
- Read the entire review.md file to understand the workflow
- Determine review scope (specific feature or entire codebase)
- Run automated checks: deno task check, deno task test, deno task test:coverage
- Review code quality: check for code smells, error handling, duplicate code, proper logging
- Review tests: check coverage, TDD principles, business logic focus
- Review security: input validation (Zod), auth/authorization, XSS, CSRF protection
- Use tests/README.md for testing guidelines
- Follow project conventions in .github/copilot-instructions.md
- Provide summary with issues, fixes, good practices, and next steps

Security is critical for production deployment.
