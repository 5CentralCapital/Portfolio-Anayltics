import 'dotenv/config';
import { db, pool } from '../db';

async function columnExists(table: string, column: string): Promise<boolean> {
  const result = await db.execute(
    `select 1 from information_schema.columns where table_name='${table}' and column_name='${column}' limit 1`
  );
  return (result as any).rows.length > 0;
}

async function ensureColumn(table: string, column: string, ddl: string) {
  const exists = await columnExists(table, column);
  if (!exists) {
    await db.execute(`alter table ${table} add column ${ddl}`);
    console.log(`Added ${table}.${column}`);
  }
}

async function run() {
  // property_loans live data columns
  await ensureColumn('property_loans', 'external_loan_id', "external_loan_id text");
  await ensureColumn('property_loans', 'principal_balance', "principal_balance numeric(15,2)");
  await ensureColumn('property_loans', 'next_payment_date', "next_payment_date date");
  await ensureColumn('property_loans', 'next_payment_amount', "next_payment_amount numeric(12,2)");
  await ensureColumn('property_loans', 'last_payment_date', "last_payment_date date");
  await ensureColumn('property_loans', 'last_payment_amount', "last_payment_amount numeric(12,2)");
  await ensureColumn('property_loans', 'escrow_balance', "escrow_balance numeric(12,2)");
  await ensureColumn('property_loans', 'remaining_term', "remaining_term integer");
  await ensureColumn('property_loans', 'last_sync_date', "last_sync_date timestamp");
  await ensureColumn('property_loans', 'sync_status', "sync_status text");
  await ensureColumn('property_loans', 'sync_error', "sync_error text");

  // property_assumptions management_fee
  await ensureColumn('property_assumptions', 'management_fee', "management_fee numeric(5,4) default 0.08");

  // Remove sample seed row if present
  await db.execute("delete from properties where address='123 Sample St'");
}

run()
  .then(async () => { await pool.end(); })
  .catch(async (err) => { console.error(err); await pool.end(); process.exit(1); });


