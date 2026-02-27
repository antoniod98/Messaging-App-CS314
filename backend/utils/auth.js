const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// hash a plain text password using bcrypt
const hashPassword = async (password) => {
  const saltRounds = 10; // computational cost (higher = more secure but slower)
  return await bcrypt.hash(password, saltRounds);
};

// compare plain text password with hashed password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// generate a JWT token for a user
const generateToken = (payload, expiresIn = '24h') => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, { expiresIn });
};

// verify and decode a JWT token
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
};
