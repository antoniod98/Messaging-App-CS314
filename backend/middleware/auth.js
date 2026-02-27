const { verifyToken } = require('../utils/auth');
const { User } = require('../models');

// middleware to verify JWT token and authenticate user
// protects routes that require authentication
// expected token format: Cookie: jwt=<token> OR Header: Authorization: Bearer <token>
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // check cookie first (recommended for web apps)
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    // fallback to authorization header
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // no token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // verify token
    const decoded = verifyToken(token);

    // find user by ID from token
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please log in again.',
      });
    }

    // attach user to request object for use in route handlers
    req.user = {
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next(); // proceed to the next middleware/route handler
  } catch (error) {
    // handle token errors
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

    // generic server error
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
    });
  }
};

// optional middleware to attach user info if token exists
// does not block request if no token (unlike authenticate)
// useful for routes that work for both authenticated and non-authenticated users
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

    next(); // always proceed, even without token
  } catch (error) {
    // silently fail for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};
