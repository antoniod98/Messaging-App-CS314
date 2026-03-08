const { Server } = require('socket.io');
const { authenticateSocket } = require('./auth');
const messageHandlers = require('./messageHandlers');

// store online users - maps userId to socket.id
const onlineUsers = new Map();

// initialize Socket.IO server with configuration
function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps)
        if (!origin) return callback(null, true);

        // allow any localhost origin for development
        if (origin.startsWith('http://localhost:')) {
          return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    // connection timeout and ping settings
    pingTimeout: 60000, // how long to wait for ping response before considering connection closed
    pingInterval: 25000, // how often to send ping packets
  });

  // apply authentication middleware to all socket connections
  io.use(authenticateSocket);

  // handle new socket connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userEmail} (${socket.userId})`);

    // add user to online users map
    onlineUsers.set(socket.userId.toString(), socket.id);

    // broadcast user online status to all connected clients
    io.emit('userStatusChange', {
      userId: socket.userId.toString(),
      status: 'online',
    });

    // register message event handlers
    messageHandlers(io, socket);

    // handle request for online users list
    socket.on('getOnlineUsers', () => {
      const onlineUserIds = Array.from(onlineUsers.keys());
      socket.emit('onlineUsersList', onlineUserIds);
    });

    // handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.userEmail} - Reason: ${reason}`);

      // remove user from online users map
      onlineUsers.delete(socket.userId.toString());

      // broadcast user offline status to all connected clients
      io.emit('userStatusChange', {
        userId: socket.userId.toString(),
        status: 'offline',
      });
    });

    // handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userEmail}:`, error);
    });
  });

  return io;
}

module.exports = { initializeSocket };
