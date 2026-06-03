import 'dotenv/config';

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'src/infrastructure/database/schema.prisma',
  migrations: {
    seed: 'tsx src/infrastructure/database/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
