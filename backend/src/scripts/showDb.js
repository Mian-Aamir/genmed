// Prints every table in the GenMed SQLite database (read-only). Usage: npm run db:show
// Password hashes are shortened so the output can be shown on screen; they are never plaintext.
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { config } from '../config.js';

if (!existsSync(config.dbFile)) {
  console.log(`No database yet at ${config.dbFile}. Run "npm run db:reset" or "npm start" first.`);
  process.exit(0);
}

const db = new DatabaseSync(config.dbFile, { readOnly: true });
console.log(`Database file: ${config.dbFile}\n`);

const queries = {
  users: 'SELECT id, name, email, role, substr(password_hash, 1, 20) || \'…\' AS password_hash, created_at FROM users ORDER BY id',
  medicine_requests: 'SELECT \'GM-\' || id AS reference, owner_id, medicine, category, quantity, notes, status, request_date FROM medicine_requests ORDER BY id',
  review_requests: 'SELECT id, patient_id, medicine_id, status, internal_note, reviewed_by, created_at FROM review_requests ORDER BY id',
  medicines: 'SELECT id, brand, formula, strength, form, price FROM medicines ORDER BY id',
};

for (const [table, sql] of Object.entries(queries)) {
  const rows = db.prepare(sql).all().map(row => ({ ...row }));
  console.log(`=== ${table} (${rows.length} rows) ===`);
  if (rows.length) console.table(rows);
  else console.log('(empty)\n');
}
db.close();
