import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { sampleMedicines } from './seed/medicines.js';
import { checkPasswordPolicy, validateRegistration } from './validation.js';

function seedMedicines(db) {
  if (db.prepare('SELECT COUNT(*) AS n FROM medicines').get().n > 0) return;
  const insert = db.prepare(`INSERT INTO medicines (id, brand, formula, strength, form, manufacturer, pack, price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const m of sampleMedicines) insert.run(m.id, m.brand, m.formula, m.strength, m.form, m.manufacturer, m.pack, m.price);
}

/**
 * Creates the doctor account from DOCTOR_NAME / DOCTOR_EMAIL / DOCTOR_PASSWORD in .env if it
 * does not exist yet. Public registration only creates patients, so this is how a doctor is
 * provisioned. The password is hashed with bcrypt and never stored in plaintext.
 */
export function ensureDoctorAccount(db, env = process.env, rounds = config.bcryptRounds) {
  const { DOCTOR_NAME: name = 'Doctor', DOCTOR_EMAIL: email, DOCTOR_PASSWORD: password } = env;
  if (!email || !password) return { created: false, reason: 'not-configured' };
  const { ok, errors, values } = validateRegistration({ name, email, password });
  if (!ok) throw new Error(`Invalid doctor account in .env: ${Object.values(errors).join(' ')}`);
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(values.email)) return { created: false, reason: 'exists' };
  db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'doctor')")
    .run(values.name, values.email, bcrypt.hashSync(values.password, rounds));
  return { created: true, email: values.email };
}

// Fictional accounts and records used ONLY by the automated tests (sampleData: true).
// A normal database starts empty: people create their own accounts on the Register page.
export const TEST_ACCOUNTS = Object.freeze({
  patient: { name: 'Ali Khan', email: 'patient@example.com', password: 'PatientPass1', role: 'patient' },
  otherPatient: { name: 'Zara Ahmed', email: 'other.patient@example.com', password: 'OtherPatient1', role: 'patient' },
  doctor: { name: 'Dr Sara Malik', email: 'doctor@example.com', password: 'DoctorPass1', role: 'doctor' },
});

function seedTestData(db, rounds) {
  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0) return;
  const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
  const insertReview = db.prepare('INSERT INTO review_requests (patient_id, medicine_id, internal_note) VALUES (?, ?, ?)');
  const insertRequest = db.prepare(`INSERT INTO medicine_requests (owner_id, medicine, category, quantity, notes, status, request_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const ids = {};
  for (const [key, user] of Object.entries(TEST_ACCOUNTS)) {
    if (checkPasswordPolicy(user.password)) throw new Error(`Test account ${key} breaks the password policy`);
    ids[key] = Number(insertUser.run(user.name, user.email, bcrypt.hashSync(user.password, rounds), user.role).lastInsertRowid);
  }
  insertReview.run(ids.patient, 1, 'Intake: confirm formulation before discussing options.');
  insertReview.run(ids.otherPatient, 8, 'Second patient record for ownership testing.');
  insertRequest.run(ids.patient, 'Paracetamol', 'Painkiller', 1, '', 'Delivered', '2026-10-01');
  insertRequest.run(ids.patient, 'Omeprazole', 'Stomach/Acid', 2, '', 'Approved', '2026-10-02');
  insertRequest.run(ids.patient, 'Cetirizine', 'Allergy', 1, '', 'Dispatched', '2026-10-03');
  insertRequest.run(ids.otherPatient, 'Amoxicillin', 'Antibiotic', 1, 'Record owned by another patient.', 'Pending', '2026-10-04');
}

/**
 * Opens (or creates) the SQLite database and applies database/schema.sql.
 * Pass ':memory:' and { sampleData: true } for an isolated, pre-filled test database.
 */
export function openDatabase(file = config.dbFile, { bcryptRounds = config.bcryptRounds, sampleData = false, env = process.env } = {}) {
  if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(readFileSync(config.schemaFile, 'utf8'));
  db.exec('BEGIN');
  try {
    seedMedicines(db);
    if (sampleData) seedTestData(db, bcryptRounds);
    else ensureDoctorAccount(db, env, bcryptRounds);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return db;
}
