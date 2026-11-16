import { config } from './config.js';
import { openDatabase } from './db.js';
import { createApp } from './app.js';

const db = openDatabase();
const app = createApp(db);

if (config.jwtSecretGenerated) {
  console.warn('[genmed-api] JWT_SECRET is not set; using a random secret for this run. '
    + 'Logins will be invalidated on restart. Copy .env.example to .env to set one.');
}

// Listen on localhost only: this is a local classroom server.
app.listen(config.port, '127.0.0.1', () => {
  console.log(`[genmed-api] Listening on http://localhost:${config.port}`);
  console.log(`[genmed-api] SQLite database: ${config.dbFile}`);
});
