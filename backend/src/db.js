import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { sampleMedicines } from './seed/medicines.js';

// SECURITY: Classroom seed accounts. Only the bcrypt HASH of each password is stored in the
// database. The plaintext values are documented in backend/README.md for the demo and are
// not bundled into the frontend.
const seedUsers = [
  { name: 'Ali Demo', email: 'patient@example.com', password: 'PatientDemo1!', role: 'patient' },
  { name: 'Zara Demo', email: 'other.patient@example.com', password: 'OtherPatient1!', role: 'patient' },
  { name: 'Dr Sara Demo', email: 'doctor@example.com', password: 'DoctorDemo1!', role: 'doctor' },
];

function seed(db, rounds) {
  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (userCount > 0) return;

  const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
  const insertMedicine = db.prepare(`INSERT INTO medicines (id, brand, formula, strength, form, manufacturer, pack, price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertReview = db.prepare('INSERT INTO review_requests (patient_id, medicine_id, internal_note) VALUES (?, ?, ?)');
  const insertRequest = db.prepare(`INSERT INTO medicine_requests (owner_id, medicine, category, quantity, notes, status, request_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);

  db.exec('BEGIN');
  try {
    const ids = {};
    for (const user of seedUsers) {
      const hash = bcrypt.hashSync(user.password, rounds);
      ids[user.email] = Number(insertUser.run(user.name, user.email, hash, user.role).lastInsertRowid);
    }
    for (const m of sampleMedicines) {
      insertMedicine.run(m.id, m.brand, m.formula, m.strength, m.form, m.manufacturer, m.pack, m.price);
    }
    const patient = ids['patient@example.com'];
    const other = ids['other.patient@example.com'];
    insertReview.run(patient, 1, 'Demo intake: confirm formulation before discussing options.');
    insertReview.run(other, 8, 'Fictional second patient record for ownership testing.');
    insertRequest.run(patient, 'Paracetamol', 'Painkiller', 1, '', 'Delivered', '2026-10-01');
    insertRequest.run(patient, 'Omeprazole', 'Stomach/Acid', 2, '', 'Approved', '2026-10-02');
    insertRequest.run(patient, 'Cetirizine', 'Allergy', 1, '', 'Dispatched', '2026-10-03');
    insertRequest.run(other, 'Amoxicillin', 'Antibiotic', 1, 'Fictional record owned by another patient.', 'Pending', '2026-10-04');
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Opens (or creates) the SQLite database, applies the schema and seeds demo data once.
 * Pass ':memory:' for an isolated database in tests.
 */
export function openDatabase(file = config.dbFile, { bcryptRounds = config.bcryptRounds } = {}) {
  if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(readFileSync(config.schemaFile, 'utf8'));
  seed(db, bcryptRounds);
  return db;
}
