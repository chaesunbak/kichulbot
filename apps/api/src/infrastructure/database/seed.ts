import { createHash } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

import { PrismaClient, UserAuthType, UserRole } from './prisma-client';

const connectionString = requiredEnv('DATABASE_URL');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const email = requiredEnv('ADMIN_EMAIL');
  const password = requiredEnv('ADMIN_PASSWORD');
  const nickname = requiredEnv('ADMIN_NICKNAME');

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

  const paperImportServiceToken = requiredEnv('PAPER_IMPORT_SERVICE_TOKEN');
  await prisma.serviceAccount.upsert({
    where: { name: 'extractor' },
    create: {
      name: 'extractor',
      tokenHash: hashToken(paperImportServiceToken),
    },
    update: {
      tokenHash: hashToken(paperImportServiceToken),
      isActive: true,
      expiresAt: null,
    },
  });

  console.log('Seeded service account: extractor');
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function requiredEnv(key: string) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
