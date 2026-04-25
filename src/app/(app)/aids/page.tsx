import AidsBrowse from '@/components/AidsBrowse';
import { prisma } from '@/lib/db';
import aidsData from '@/data/aids.json';
import type { Aid } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getAids(): Promise<Aid[]> {
  const localCatalog = (aidsData as Aid[]).filter((a) => a.is_active !== false);

  if (!process.env.DATABASE_URL) return localCatalog;

  try {
    const rows = await prisma.aid.findMany();
    if (rows.length === 0) throw new Error('aids table empty');
    const fromDb = rows
      .map((r) => r.data as unknown as Aid)
      .filter((a) => a.is_active !== false);
    return fromDb;
  } catch (err) {
    console.error('[aids] DB unreachable, falling back to local catalog', err);
    return localCatalog;
  }
}

export default async function AidsPage() {
  const aids = await getAids();
  return <AidsBrowse aids={aids} />;
}
