function normalizeRole(r) {
  if (!r) return '';
  return r.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function authorize(...allowedRoles) {
  const allowed = allowedRoles.map(r => normalizeRole(r));
  return (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const role = normalizeRole(req.user.role || '');
      if (!allowed.includes(role)) {
        return res.status(403).json({ error: 'Forbidden: insufficient role' });
      }
      next();
    } catch (err) {
      return res.status(500).json({ error: 'Authorization error' });
    }
  }
}
