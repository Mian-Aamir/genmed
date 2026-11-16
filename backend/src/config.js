import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// SECURITY: The JWT signing secret comes from the environment (.env, never committed).
// If it is missing we generate a random one for this process instead of using a hardcoded
// fallback. Tokens then stop working after a restart, which is the safe failure mode.
function loadJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret?.startsWith('replace-with')) throw new Error('Set JWT_SECRET in .env to a real random value.');
  if (secret && secret.length >= 32) return { secret, generated: false };
  if (secret) throw new Error('JWT_SECRET must be at least 32 characters long.');
  return { secret: randomBytes(48).toString('hex'), generated: true };
}

const jwt = loadJwtSecret();

export const config = Object.freeze({
  port: Number(process.env.PORT) || 4000,
  dbFile: process.env.DB_FILE || path.join(backendRoot, 'data', 'genmed.db'),
  schemaFile: path.join(backendRoot, 'database', 'schema.sql'),
  jwtSecret: jwt.secret,
  jwtSecretGenerated: jwt.generated,
  jwtExpiresIn: '1h',
  jwtIssuer: 'genmed-api',
  jwtAudience: 'genmed-web',
  bcryptRounds: 12,
  // Allowed browser origin for the Vite dev server. Same-origin requests through the Vite proxy
  // do not need CORS at all.
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
});
