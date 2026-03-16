const { verifyToken } = require('../utils/auth');
const { User } = require('../models');

// checks if user is logged in before letting them access a route
// looks for JWT in cookies or Authorization header
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // try cookie first
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    // otherwise check auth header
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please log in again.',
      });
    }

    // stick user info on the request so routes can use it
    req.user = {
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    if (error.message === 'Token has expired') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }

    if (error.message === 'Invalid token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
    });
  }
};

// like authenticate but doesn't block the request if there's no token
// useful for pages that work differently when you're logged in vs not
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);

      if (user) {
        req.user = {
          userId: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      }
    }

    next();
  } catch (error) {
    // just let them through even if token is bad
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};
