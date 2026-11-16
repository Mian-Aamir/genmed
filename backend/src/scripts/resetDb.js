// Deletes the local SQLite file and recreates it from database/schema.sql with fresh seed data.
import { rmSync } from 'node:fs';
import { config } from '../config.js';
import { openDatabase } from '../db.js';

for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(config.dbFile + suffix, { force: true });
openDatabase().close();
console.log(`[genmed-api] Database reset: ${config.dbFile}`);
