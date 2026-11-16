import { config } from './config.js';
import { openDatabase } from './db.js';
import { createApp } from './app.js';

const db = openDatabase();
const app = createApp(db);

if (config.jwtSecretGenerated) {
  console.warn('[genmed-api] JWT_SECRET is not set; using a random secret for this run. '
    + 'Logins will be invalidated on restart. Copy .env.example to .env to set one.');
}
if (!db.prepare("SELECT 1 FROM users WHERE role = 'doctor'").get()) {
  console.warn('[genmed-api] No doctor account exists. Set DOCTOR_NAME, DOCTOR_EMAIL and DOCTOR_PASSWORD '
    + 'in .env and restart to create one. Patients can register from the website.');
}

// Listen on localhost only: this is a local classroom server.
app.listen(config.port, '127.0.0.1', () => {
  console.log(`[genmed-api] Listening on http://localhost:${config.port}`);
  console.log(`[genmed-api] SQLite database: ${config.dbFile}`);
});
