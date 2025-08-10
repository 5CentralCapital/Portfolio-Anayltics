import 'dotenv/config';
import { db } from '../db';
import { sql, and, eq } from 'drizzle-orm';
import { users, entityOwnership } from '@shared/schema';

async function ensureDevUser(devUserId: number) {
  // Try to insert user with fixed ID; ignore if it already exists
  await db.execute(sql`
    INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active, created_at, updated_at)
    VALUES (${devUserId}, 'dev@example.com', 'dev-placeholder-hash', 'viewer', 'Dev', 'User', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `);
}

async function grantAllEntities(devUserId: number) {
  const distinct = await db.execute(sql`SELECT DISTINCT entity FROM properties WHERE entity IS NOT NULL AND entity <> ''`);
  const entities: string[] = (distinct.rows as any[]).map((r) => r.entity).filter(Boolean);

  for (const name of entities) {
    // Check if already granted
    const existing = await db.select().from(entityOwnership)
      .where(and(eq(entityOwnership.userId, devUserId as any), eq(entityOwnership.entityName, name)));
    if ((existing as any).length > 0) continue;

    await db.insert(entityOwnership).values({
      userId: devUserId,
      entityName: name,
      assetType: 'real_estate',
      ownershipPercentage: '100.00',
      currentValue: '0',
      description: 'Auto-granted for development access'
    } as any);
    console.log(`Granted access to '${name}'`);
  }
}

async function main() {
  const devUserId = Number(process.env.DEV_USER_ID || 1);
  await ensureDevUser(devUserId);
  await grantAllEntities(devUserId);
  console.log('Dev user seeded and entity access granted.');
}

main().catch((e) => { console.error(e); process.exit(1); });


