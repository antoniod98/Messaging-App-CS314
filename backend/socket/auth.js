const { verifyToken } = require('../utils/auth');

// socket authentication middleware
// verifies JWT token from socket handshake and attaches user data to socket
const authenticateSocket = (socket, next) => {
  try {
    // extract token from socket handshake auth object
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // verify token and decode payload
    const decoded = verifyToken(token);

    if (!decoded) {
      return next(new Error('Authentication error: Invalid token'));
    }

    // attach user data to socket object for use in event handlers
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;

    next(); // continue with connection
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Token verification failed'));
  }
};

module.exports = { authenticateSocket };
