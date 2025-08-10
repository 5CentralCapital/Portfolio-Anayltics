import 'dotenv/config';
import { pool } from '../db';

async function main() {
  console.log('Using DATABASE_URL:', process.env.DATABASE_URL?.replace(/(:)([^:@\/]+)(@)/, '$1****$3'));

  const client = await pool.connect();
  try {
    const tables = await client.query(
      `select table_name from information_schema.tables where table_schema='public' order by table_name`
    );
    console.log('\nPublic tables:');
    console.table(tables.rows);

    // properties count
    const hasProperties = tables.rows.some((r) => r.table_name === 'properties');
    if (hasProperties) {
      const countRes = await client.query('select count(*)::int as count from properties');
      console.log(`\nproperties rows: ${countRes.rows[0].count}`);
      if (countRes.rows[0].count > 0) {
        const sample = await client.query(
          `select id, address, city, state, apartments, is_featured from properties order by id desc limit 5`
        );
        console.log('\nSample properties:');
        console.table(sample.rows);
      }
    } else {
      console.log("\nTable 'properties' not found in public schema.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('inspect-db error:', e);
  process.exit(1);
});


