import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { config } from '../config/index.js';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function omitPassword(row) {
  const { password_hash, ...user } = row;
  return user;
}

export async function register(req, res, next) {
  try {
    const { email, password, full_name, phone, driver_license_number, address } =
      req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        error: true,
        message: 'Email, password, and full name are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: true,
        message: 'Password must be at least 8 characters',
      });
    }

    const password_hash = await bcrypt.hash(password, config.bcryptRounds);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, driver_license_number, address, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'client')
       RETURNING id, email, full_name, phone, driver_license_number, address, role, created_at, is_active`,
      [
        email.toLowerCase().trim(),
        password_hash,
        full_name.trim(),
        phone || null,
        driver_license_number || null,
        address || null,
      ]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: true, message: 'Email already registered' });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Email and password are required',
      });
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, phone, driver_license_number, address, role, created_at, is_active
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: true, message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: true, message: 'Account is deactivated' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: true, message: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({ token, user: omitPassword(user) });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res) {
  res.json({ user: req.dbUser });
}

export async function updateProfile(req, res, next) {
  try {
    const { full_name, phone, driver_license_number, address, password, date_of_birth } =
      req.body;

    const fields = [];
    const values = [];
    let i = 1;

    if (full_name !== undefined) {
      fields.push(`full_name = $${i++}`);
      values.push(full_name.trim());
    }
    if (phone !== undefined) {
      fields.push(`phone = $${i++}`);
      values.push(phone || null);
    }
    if (driver_license_number !== undefined) {
      fields.push(`driver_license_number = $${i++}`);
      values.push(driver_license_number || null);
    }
    if (address !== undefined) {
      fields.push(`address = $${i++}`);
      values.push(address || null);
    }
    if (date_of_birth !== undefined) {
      fields.push(`date_of_birth = $${i++}`);
      values.push(date_of_birth || null);
    }
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          error: true,
          message: 'Password must be at least 8 characters',
        });
      }
      const password_hash = await bcrypt.hash(password, config.bcryptRounds);
      fields.push(`password_hash = $${i++}`);
      values.push(password_hash);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: true, message: 'No fields to update' });
    }

    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${i}
       RETURNING id, email, full_name, phone, driver_license_number, address, date_of_birth, role, created_at, is_active`,
      values
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
}
