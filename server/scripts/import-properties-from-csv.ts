import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { db } from '../db';
import {
  properties,
  type InsertProperty,
} from '@shared/schema';
import { and, eq } from 'drizzle-orm';

function parseMoney(input: any): string {
  if (input === null || input === undefined) return '0';
  const s = String(input)
    .replace(/[$,]/g, '')
    .replace(/\(([^)]+)\)/, '-$1')
    .trim();
  const n = parseFloat(s);
  return isFinite(n) ? n.toString() : '0';
}

function parseNumber(input: any): number {
  if (input === null || input === undefined) return 0;
  const s = String(input)
    .replace(/[%$,]/g, '')
    .replace(/\(([^)]+)\)/, '-$1')
    .trim();
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

function parseDate(input: any): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

type Row = Record<string, any>;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/\s+/g, ' ').trim();
}

function get(row: Row, variants: string[]): any {
  const keys = Object.keys(row);
  for (const v of variants) {
    const target = normalizeKey(v);
    const match = keys.find(k => normalizeKey(k) === target);
    if (match) return row[match];
  }
  return undefined;
}

async function upsertProperty(row: Row, defaultStatus?: string) {
  const statusRaw = get(row, ['status']) ?? defaultStatus;
  const status = (statusRaw || '').toString().toLowerCase().includes('sold')
    ? 'Sold'
    : (statusRaw || '').toString().toLowerCase().includes('rehab')
      ? 'Rehabbing'
      : (statusRaw || '').toString().toLowerCase().includes('under')
        ? 'Under Contract'
        : 'Cashflowing';

  const address = (get(row, ['property address', 'address', 'property name or unit #']) || '').toString().trim();
  const city = (get(row, ['city']) || '').toString().trim();
  const state = (get(row, ['state']) || '').toString().trim();
  const zip = (get(row, ['zip', 'zipcode']) || '').toString().trim();
  const entity = (get(row, ['ownership name', 'ownership structure', 'entity']) || '').toString().trim();
  const apartments = parseNumber(get(row, ['# of apartments', 'units', 'num units']));

  const acquisitionDate = parseDate(get(row, ['acquisition date']));
  const acquisitionPrice = parseMoney(get(row, ['acquisition price']));
  const rehabCosts = parseMoney(get(row, ['rehab costs']));
  // ARV mapping: for Sold rows, use historical ARV; for Currently Own, use present market value if available
  let arvAtTimePurchased = '0';
  if (status === 'Sold') {
    arvAtTimePurchased = parseMoney(get(row, ['arv (at the time)', 'arv at the time', 'arv']));
  } else {
    arvAtTimePurchased = parseMoney(get(row, [
      'present market v',
      'present market value',
      'present market v noi',
      'present market value noi',
      'current arv',
      'arv'
    ]));
  }
  const initialCapitalRequired = parseMoney(get(row, ['initial capital required', 'initial capital']));
  const totalProfits = parseMoney(get(row, ['total profit', 'total profits']));
  let yearsHeld: string | null = null;
  if (get(row, ['years held']) !== undefined) {
    const y = parseNumber(get(row, ['years held']));
    if (isFinite(y)) {
      const clamped = Math.max(0, Math.min(99.9, y));
      yearsHeld = clamped.toFixed(1);
    }
  }
  const cashOnCashReturn = (() => {
    const v = get(row, ['cash on cash return']);
    const n = v !== undefined ? parseNumber(v) : 0;
    return Math.max(-999, Math.min(999, n)).toFixed(2);
  })();
  const annualizedReturn = (() => {
    const v = get(row, ['irr', 'annualized return']);
    const n = v !== undefined ? parseNumber(v) : 0;
    return Math.max(-999, Math.min(999, n)).toFixed(2);
  })();
  const cashFlow = parseMoney(get(row, ['cashflow', 'total cashflow collected']));
  const salePrice = parseMoney(get(row, ['sale price']));
  const saleDate = parseDate(get(row, ['sale date']));

  // Upsert by address+city+state+zip
  const existing = await db.select().from(properties).where(
    and(
      eq(properties.address, address),
      eq(properties.city, city),
      eq(properties.state, state),
      eq(properties.zipCode, zip || null)
    )
  );

  const payload: InsertProperty = {
    status: status as any,
    apartments: apartments || 1,
    address,
    city,
    state,
    zipCode: zip || null,
    entity: entity || '5Central Capital',
    acquisitionDate: acquisitionDate || null,
    acquisitionPrice,
    rehabCosts,
    arvAtTimePurchased,
    initialCapitalRequired: initialCapitalRequired || '0',
    cashFlow: cashFlow || '0',
    salePrice: salePrice || null,
    totalProfits: totalProfits || '0',
    yearsHeld: yearsHeld || null,
    cashOnCashReturn: cashOnCashReturn,
    annualizedReturn: annualizedReturn,
    dealAnalyzerData: null,
    isFeatured: false,
  } as any;

  if (existing.length > 0) {
    await db.update(properties)
      .set({ ...payload, updatedAt: new Date() })
      .where(and(
        eq(properties.address, address),
        eq(properties.city, city),
        eq(properties.state, state)
      ));
    console.log(`Updated: ${address}, ${city} ${state}`);
  } else {
    await db.insert(properties).values(payload);
    console.log(`Inserted: ${address}, ${city} ${state}`);
  }
}

async function main() {
  const csvPath = process.argv[2];
  const statusArg = (process.argv[3] || '').toLowerCase();
  if (!csvPath) {
    console.error('Usage: npx tsx server/scripts/import-properties-from-csv.ts /abs/path/to/file.csv [sold|own]');
    process.exit(1);
  }
  const abs = path.resolve(csvPath);
  const buf = fs.readFileSync(abs);
  const records: Row[] = parse(buf, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_column_count_more: true,
    relax_column_count_less: true,
    trim: true,
    relax_quotes: true,
  });

  const defaultStatus = statusArg.includes('sold') ? 'Sold' : statusArg.includes('own') ? 'Cashflowing' : undefined;

  for (const row of records) {
    // skip separator rows
    const addr = get(row, ['property address', 'address', 'property name or unit #']);
    if (!addr || String(addr).trim() === '') continue;
    await upsertProperty(row, defaultStatus);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


