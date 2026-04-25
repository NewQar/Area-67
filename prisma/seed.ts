import { PrismaClient } from '@prisma/client';
import aids from '../src/data/aids.json';

const prisma = new PrismaClient();

async function main() {
  for (const aid of aids) {
    await prisma.aid.upsert({
      where: { id: aid.id },
      update: {
        name: aid.name,
        nameEn: aid.nameEn,
        amount: aid.amount,
        frequency: aid.frequency,
        description: aid.description,
        applyUrl: aid.applyUrl,
        provider: aid.provider,
        criteria: aid.criteria,
      },
      create: {
        id: aid.id,
        name: aid.name,
        nameEn: aid.nameEn,
        amount: aid.amount,
        frequency: aid.frequency,
        description: aid.description,
        applyUrl: aid.applyUrl,
        provider: aid.provider,
        criteria: aid.criteria,
      },
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
