import 'dotenv/config';
import { db } from '../db';

async function main() {
  // 1) Normalize state to two-letter uppercase letters only
  await db.execute(
    `UPDATE properties
     SET state = UPPER(REGEXP_REPLACE(state, '[^A-Za-z]', '', 'g'))
     WHERE state ~ '[^A-Za-z]';`
  );

  // 2) Remove obviously bad rows from earlier malformed import
  //    e.g., address purely numeric or extremely short
  await db.execute(
    `DELETE FROM properties
     WHERE address ~ '^[0-9]+$' OR char_length(address) < 4;`
  );

  // 3) Optionally trim stray backticks and whitespace across key text fields
  await db.execute(
    `UPDATE properties
     SET 
       address = TRIM(BOTH ' ' FROM REPLACE(address, '\u0060', '')),
       city    = TRIM(BOTH ' ' FROM REPLACE(city, '\u0060', ''))
     WHERE address LIKE '%\u0060%' OR city LIKE '%\u0060%';`
  );

  console.log('Cleanup complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });


