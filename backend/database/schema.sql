-- GenMed database setup script (Development Activity 6).
-- Engine: SQLite 3. The backend runs this file automatically on start (CREATE ... IF NOT EXISTS),
-- so it is safe to run more than once. Seed rows are inserted by src/db.js because passwords
-- must be hashed with bcrypt first; plaintext passwords are never stored.

PRAGMA foreign_keys = ON;

-- Shared: accounts used by both modules. Roles are provisioned here, never accepted from a form.
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL CHECK (length(name) BETWEEN 3 AND 80),
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE CHECK (length(email) <= 254),
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('patient', 'doctor')),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Reference data: sample medicine catalogue (fictional/illustrative records).
CREATE TABLE IF NOT EXISTS medicines (
  id           INTEGER PRIMARY KEY,
  brand        TEXT    NOT NULL,
  formula      TEXT    NOT NULL,
  strength     TEXT    NOT NULL,
  form         TEXT    NOT NULL,
  manufacturer TEXT    NOT NULL,
  pack         TEXT    NOT NULL,
  price        INTEGER NOT NULL CHECK (price >= 0)
);

-- Module 1 (Muhammad Aamir): medicine review requests reviewed by a doctor.
CREATE TABLE IF NOT EXISTS review_requests (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medicine_id   INTEGER NOT NULL REFERENCES medicines(id),
  status        TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'discussion')),
  internal_note TEXT    NOT NULL DEFAULT '' CHECK (length(internal_note) <= 300),
  reviewed_by   INTEGER REFERENCES users(id),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT
);

-- Module 2 (Ammar Ahmad): medicine requests submitted and tracked by a patient.
CREATE TABLE IF NOT EXISTS medicine_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medicine    TEXT    NOT NULL CHECK (length(medicine) BETWEEN 3 AND 120),
  category    TEXT    NOT NULL CHECK (category IN ('Painkiller', 'Antibiotic', 'Allergy', 'Stomach/Acid', 'Other')),
  quantity    INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  notes       TEXT    NOT NULL DEFAULT '' CHECK (length(notes) <= 200),
  status      TEXT    NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Dispatched', 'Delivered')),
  request_date TEXT   NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Public request references start at GM-1001 (Module 2 numbering from earlier activities).
INSERT INTO sqlite_sequence (name, seq)
  SELECT 'medicine_requests', 1000
  WHERE NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'medicine_requests');

CREATE INDEX IF NOT EXISTS idx_review_requests_patient ON review_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_medicine_requests_owner ON medicine_requests(owner_id);
