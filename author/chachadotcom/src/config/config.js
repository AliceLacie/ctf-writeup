require('dotenv').config();
const crypto = require('crypto');
 
module.exports = {
  port: process.env.PORT || 3000,
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/chachadb',
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
}; 