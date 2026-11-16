import express from 'express';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './errors.js';
import { authRoutes } from './routes/auth.js';
import { reviewRoutes } from './routes/reviews.js';
import { requestRoutes } from './routes/requests.js';

export function createApp(db, options = {}) {
  const app = express();
  app.disable('x-powered-by');

  // Basic security headers for an API that only returns JSON.
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Cache-Control': 'no-store',
    });
    // CORS for the Vite dev server only. Requests through the Vite proxy are same-origin.
    const origin = req.get('origin');
    if (origin && origin === config.corsOrigin) {
      res.set({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        Vary: 'Origin',
      });
      if (req.method === 'OPTIONS') return res.sendStatus(204);
    }
    return next();
  });

  // SECURITY: Small JSON bodies only.
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ ok: true, service: 'genmed-api', database: 'connected' });
  });

  // Public reference data used by both modules.
  const listMedicines = db.prepare('SELECT id, brand, formula, strength, form, manufacturer, pack, price FROM medicines ORDER BY id');
  app.get('/api/medicines', (_req, res) => res.json({ ok: true, medicines: listMedicines.all() }));

  app.use('/api/auth', authRoutes(db, options));
  app.use('/api/reviews', reviewRoutes(db)); // Module 1
  app.use('/api/requests', requestRoutes(db)); // Module 2

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
