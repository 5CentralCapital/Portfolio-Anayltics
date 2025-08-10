import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

function findHeaderIndex(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Some exports start with an extra leading comma
    const trimmed = line.replace(/^\s+/, '');
    if (trimmed.startsWith('Count,') || line.startsWith(',Count,')) {
      return i;
    }
  }
  return -1;
}

function splitSections(lines: string[]): { header: string; sections: string[][] } {
  const headerIndex1 = findHeaderIndex(lines);
  if (headerIndex1 === -1) {
    throw new Error('Could not find header line starting with "Count," in CSV');
  }
  const headerLine = lines[headerIndex1].replace(/^\s+/, '').replace(/^,/, '');

  // Look for a second header (for a second table in the same sheet)
  let headerIndex2 = -1;
  for (let i = headerIndex1 + 1; i < lines.length; i++) {
    const l = lines[i];
    const trimmed = l.replace(/^\s+/, '');
    if (trimmed.startsWith('Count,') || l.startsWith(',Count,')) {
      headerIndex2 = i;
      break;
    }
  }

  const firstSection = lines.slice(headerIndex1 + 1, headerIndex2 === -1 ? lines.length : headerIndex2);
  const secondSection = headerIndex2 === -1 ? [] : lines.slice(headerIndex2 + 1);

  return { header: headerLine, sections: [firstSection, secondSection] };
}

function normalizeDataLine(line: string): string {
  let l = line.trim();
  // Drop a leading stray comma that shifts all columns
  if (l.startsWith(',')) l = l.slice(1);
  // Remove accidental backticks or Excel artifact text chunks in the middle of values
  l = l.replace(/`\+[^,]*/g, '');
  return l;
}

function cleanRows(rows: string[]): string[] {
  return rows
    .map(normalizeDataLine)
    .filter((l) => l.length > 0)
    .filter((l) => !/^,+$/.test(l)) // remove lines of only commas
    .filter((l) => !/^Sold/i.test(l))
    .filter((l) => !/^Currently Own/i.test(l));
}

function writeCsv(filePath: string, header: string, rows: string[]) {
  const normalizedHeader = header.startsWith(',') ? header.slice(1) : header;
  const content = [normalizedHeader, ...rows].join('\n');
  fs.writeFileSync(filePath, content, 'utf8');
}

function runImport(csvPath: string, status: 'sold' | 'own') {
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['--yes', 'tsx', 'server/scripts/import-properties-from-csv.ts', csvPath, status];
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error('Import failed for', csvPath);
    process.exit(result.status || 1);
  }
}

async function main() {
  const csvPathArg = process.argv[2];
  if (!csvPathArg) {
    console.error('Usage: npx tsx server/scripts/prepare-and-import-properties.ts /abs/path/to/CSV REO_Schedule_updated.csv');
    process.exit(1);
  }
  const abs = path.resolve(csvPathArg);
  if (!fs.existsSync(abs)) {
    console.error('CSV not found at', abs);
    process.exit(1);
  }
  const raw = fs.readFileSync(abs, 'utf8');
  const lines = raw.split(/\r?\n/);

  const { header, sections } = splitSections(lines);
  const [soldRowsRaw, ownRowsRaw] = sections;

  const soldRows = cleanRows(soldRowsRaw || []);
  const ownRows = cleanRows(ownRowsRaw || []);

  // Filter to likely data rows (not totals or blanks)
  const looksLikeData = (line: string) => /,\s*\d+\s*,/.test(line) || /,\s*\w/.test(line);
  const soldFiltered = soldRows.filter(looksLikeData);
  const ownFiltered = ownRows.filter(looksLikeData);

  const dir = path.dirname(abs);
  const soldOut = path.join(dir, '_import_sold.csv');
  const ownOut = path.join(dir, '_import_own.csv');

  writeCsv(soldOut, header, soldFiltered);
  if (ownFiltered.length > 0) writeCsv(ownOut, header, ownFiltered);

  console.log('Prepared CSVs:\n', soldOut, '\n', ownFiltered.length > 0 ? ownOut : '(no own section)');

  runImport(soldOut, 'sold');
  if (ownFiltered.length > 0) runImport(ownOut, 'own');

  console.log('Import complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });


