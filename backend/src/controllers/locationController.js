import { pool } from '../db/pool.js';

export async function listLocations(req, res, next) {
  try {
    const { type } = req.query;
    const params = [];
    let sql = `SELECT id, name, city, type FROM locations WHERE is_active = true`;

    if (type) {
      params.push(type);
      sql += ` AND type = $${params.length}`;
    }

    sql += ' ORDER BY city ASC, name ASC';

    const result = await pool.query(sql, params);
    res.json({ locations: result.rows });
  } catch (err) {
    next(err);
  }
}
