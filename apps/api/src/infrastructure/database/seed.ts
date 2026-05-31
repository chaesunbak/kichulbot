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

  await prisma.exam.upsert({
    where: { slug: 'suneung' },
    create: {
      name: '수능',
      slug: 'suneung',
    },
    update: {
      name: '수능',
    },
  });

  const subject = await prisma.subject.upsert({
    where: { slug: 'korean-history' },
    create: {
      name: '한국사',
      slug: 'korean-history',
    },
    update: {
      name: '한국사',
    },
  });

  const periodTags = [
    ['선사', 'prehistoric'],
    ['고대', 'ancient'],
    ['고려', 'goryeo'],
    ['조선', 'joseon'],
    ['근대', 'modern'],
    ['일제강점기', 'japanese-occupation'],
    ['현대', 'contemporary'],
  ] as const;

  await Promise.all(
    periodTags.map(async ([name, slug]) => {
      const tag = await prisma.tag.upsert({
        where: { slug },
        create: {
          name,
          slug,
        },
        update: {
          name,
        },
      });

      await prisma.tagSubject.upsert({
        where: {
          tagId_subjectId: {
            tagId: tag.id,
            subjectId: subject.id,
          },
        },
        create: {
          tagId: tag.id,
          subjectId: subject.id,
        },
        update: {},
      });
    }),
  );

  console.log('Seeded exam, subject, and period tags');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
