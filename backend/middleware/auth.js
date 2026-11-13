const jwt = require('jsonwebtoken');
const db = require('../db');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Access token required.' });
  }

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    return res.status(500).json({ ok: false, error: 'Server misconfiguration: missing JWT_SECRET.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, name, phone FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'User no longer exists.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(403).json({ ok: false, error: 'Invalid or expired token.' });
  }
}

module.exports = authenticateToken;
