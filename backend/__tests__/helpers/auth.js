const jwt = require('jsonwebtoken');

const signTestToken = (payload = { id: 1, role: 'admin', username: 'admin' }) => {
  const secret = process.env.JWT_SECRET || 'secret_jwt_plateforme_sante_2024_dev';
  return jwt.sign(payload, secret, { expiresIn: '1h' });
};

module.exports = { signTestToken };


