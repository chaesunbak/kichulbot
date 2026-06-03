import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

import { PrismaClient, UserAuthType, UserRole } from './prisma-client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD ?? 'change-me-now';
  const nickname = process.env.ADMIN_NICKNAME ?? '관리자';

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      nickname,
      authType: UserAuthType.EMAIL,
      role: UserRole.ADMIN,
    },
    update: {
      passwordHash,
      nickname,
      authType: UserAuthType.EMAIL,
      role: UserRole.ADMIN,
    },
  });

  console.log(`Seeded admin user: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
