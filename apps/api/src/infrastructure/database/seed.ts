import { PrismaClient, UserAuthType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
