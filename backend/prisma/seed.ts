import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEV_USER_ID =
  process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001';

/**
 * Seeds the stubbed dev user that CurrentUserId falls back to, so the L3
 * endpoints work standalone before L1's real auth/users land.
 */
async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    update: {},
    create: {
      id: DEV_USER_ID,
      email: 'dev-l3@health-one.example',
      passwordHash: 'dev-only-not-a-real-hash',
      displayName: 'L3 Dev User',
    },
  });
  // eslint-disable-next-line no-console
  console.log(`Seeded dev user ${DEV_USER_ID}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
