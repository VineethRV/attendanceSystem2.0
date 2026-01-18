const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production', (err, teacher) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.teacher = teacher;
    next();
  });
};

module.exports = authenticateToken;
