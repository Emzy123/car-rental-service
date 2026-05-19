import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { pool } from '../db/pool.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'Authentication required' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: true, message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }
    next();
  };
}

export async function loadActiveUser(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, email, full_name, phone, driver_license_number, address, role, created_at, is_active
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }
    if (!result.rows[0].is_active) {
      return res.status(403).json({ error: true, message: 'Account is deactivated' });
    }
    req.dbUser = result.rows[0];
    next();
  } catch (err) {
    next(err);
  }
}
