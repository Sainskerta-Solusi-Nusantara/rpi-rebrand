import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = path.dirname(fileURLToPath(import.meta.url))

/**
 * Unit-test config for the pure, deterministic core (RBAC, scorers, analyzer).
 * Node environment, no DB and no server — these tests must stay fast and
 * deterministic so they can gate every CI run in seconds.
 *
 * The `@/` alias mirrors tsconfig `paths` so test files and the modules under
 * test resolve `@/lib/...` imports. The regex `^@/` find is deliberate so it
 * does NOT clobber scoped npm packages like `@prisma/client` or `@radix-ui/*`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: [{ find: /^@\//, replacement: `${root}/` }],
  },
})
