import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../errors.js';

export function signToken(user) {
  // SECURITY: The token carries only the user id (sub) and role, never the password or email.
  return jwt.sign({ role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    subject: String(user.id),
    expiresIn: config.jwtExpiresIn,
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
  });
}

/**
 * Activity 6 Task 4: verifies the JWT on every protected endpoint.
 * Missing, malformed, expired, re-signed or modified tokens are all rejected with 401.
 */
export function requireAuth(db) {
  const findUser = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?');
  return (req, _res, next) => {
    const header = req.get('authorization') || '';
    const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(header);
    if (!match) return next(new HttpError(401, 'Authentication required.'));

    let payload;
    try {
      // SECURITY: Pin the algorithm so "alg: none" or algorithm-confusion tokens are refused.
      payload = jwt.verify(match[1], config.jwtSecret, {
        algorithms: ['HS256'],
        issuer: config.jwtIssuer,
        audience: config.jwtAudience,
      });
    } catch {
      return next(new HttpError(401, 'Your session is invalid or has expired. Please log in again.'));
    }

    // SECURITY: Re-load the account so a deleted user or changed role takes effect immediately.
    // The role used for authorization comes from the database, not from the token body.
    const id = /^\d+$/.test(String(payload.sub)) ? Number(payload.sub) : null;
    const user = id ? findUser.get(id) : undefined;
    if (!user) return next(new HttpError(401, 'Your session is invalid or has expired. Please log in again.'));
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    return next();
  };
}

/** Activity 6 Task 5: role-based authorization. Use after requireAuth. */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission to perform this action.'));
    }
    return next();
  };
}
