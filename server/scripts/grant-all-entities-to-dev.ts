import 'dotenv/config';
import { db } from '../db';
import { entityOwnership, properties } from '@shared/schema';
import { sql, eq } from 'drizzle-orm';

async function main() {
  const devUserId = Number(process.env.DEV_USER_ID || 1);

  // Get distinct entities from properties table
  const { rows } = await db.execute(sql`SELECT DISTINCT entity FROM properties WHERE entity IS NOT NULL AND entity <> ''`);
  const entities: string[] = rows.map((r: any) => r.entity).filter(Boolean);

  for (const name of entities) {
    // Check if ownership already exists
    const existing = await db.select().from(entityOwnership)
      .where(eq(entityOwnership.userId, devUserId as any))
      .where(eq(entityOwnership.entityName, name));
    if ((existing as any).length > 0) continue;

    await db.insert(entityOwnership).values({
      userId: devUserId,
      entityName: name,
      assetType: 'real_estate',
      ownershipPercentage: '100',
      currentValue: '0',
      description: 'Auto-granted for development access'
    } as any);
    console.log(`Granted entity ownership for '${name}' to user ${devUserId}`);
  }

  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });


