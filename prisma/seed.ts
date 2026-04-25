import { PrismaClient, Prisma } from '@prisma/client';
import aids from '../src/data/aids.json';

const prisma = new PrismaClient();

async function main() {
  for (const aid of aids) {
    const data = aid as unknown as Prisma.InputJsonValue;
    await prisma.aid.upsert({
      where: { id: aid.id },
      update: { slug: aid.slug, data },
      create: { id: aid.id, slug: aid.slug, data },
    });
  }
  console.log(`Seeded ${aids.length} aids`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
