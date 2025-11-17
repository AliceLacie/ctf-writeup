const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = function(req, res, next) {
  const token = req.cookies.token || req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    req.user = decoded.user;
    if (req.user.role !== 'guide' && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Only guides can answer questions' });
    }
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}; 