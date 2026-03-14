const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const mongoose = require('mongoose');
const { User, ChatRoom, Message } = require('../models');
const { generateToken } = require('../utils/auth');

describe('Socket.IO Real-Time Messaging Unit', () => {
  let io, serverSocket, clientSocket1, clientSocket2, httpServer;
  let testUser1, testUser2, testRoom, token1, token2;

  beforeAll((done) => {
    // create HTTP server
    httpServer = createServer();

    // create Socket.IO server
    io = new Server(httpServer, {
      cors: { origin: '*' },
    });

    // attach Socket.IO authentication and event handlers
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');

        const user = await User.findById(decoded.userId);
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = decoded.userId;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    io.on('connection', (socket) => {
      serverSocket = socket;

      // Use the actual messageHandlers from your implementation
      const messageHandlers = require('../socket/messageHandlers');
      messageHandlers(io, socket);

      socket.on('disconnect', () => {
        // handle disconnect gracefully
      });
    });

    httpServer.listen(() => {
      const port = httpServer.address().port;
      done();
    });
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  beforeEach(async () => {
    // create test users
    testUser1 = await User.create({
      email: 'user1@example.com',
      password: 'hashedPassword123',
      firstName: 'User',
      lastName: 'One',
    });

    testUser2 = await User.create({
      email: 'user2@example.com',
      password: 'hashedPassword123',
      firstName: 'User',
      lastName: 'Two',
    });

    // generate tokens
    token1 = generateToken({ userId: testUser1._id, email: testUser1.email });
    token2 = generateToken({ userId: testUser2._id, email: testUser2.email });

    // create test room with both users
    testRoom = await ChatRoom.create({
      name: 'Test Room',
      creator: testUser1._id,
      participants: [testUser1._id, testUser2._id],
    });
  });

  afterEach(async () => {
    // disconnect clients
    if (clientSocket1?.connected) clientSocket1.disconnect();
    if (clientSocket2?.connected) clientSocket2.disconnect();

    // clean up database
    await User.deleteMany({});
    await ChatRoom.deleteMany({});
    await Message.deleteMany({});
  });

  describe('3.3.1 Room-Scoped Message Broadcast Test', () => {
    // Correct partition: Authenticated user sends a message to a valid room they belong to
    it('should broadcast message only to users in the correct room', (done) => {
      const port = httpServer.address().port;

      // connect user 1
      clientSocket1 = Client(`http://localhost:${port}`, {
        auth: { token: token1 },
      });

      // connect user 2
      clientSocket2 = Client(`http://localhost:${port}`, {
        auth: { token: token2 },
      });

      let connectedCount = 0;

      const handleConnect = () => {
        connectedCount++;
        if (connectedCount === 2) {
          // both users join the room
          clientSocket1.emit('joinRoom', testRoom._id.toString());
          clientSocket2.emit('joinRoom', testRoom._id.toString());
        }
      };

      clientSocket1.on('connect', handleConnect);
      clientSocket2.on('connect', handleConnect);

      let joinedCount = 0;

      const handleJoin = () => {
        joinedCount++;
        if (joinedCount === 2) {
          // user 1 sends a message
          clientSocket1.emit('sendMessage', {
            content: 'Hello from User 1',
            roomId: testRoom._id.toString(),
          });
        }
      };

      clientSocket1.on('roomJoined', handleJoin);
      clientSocket2.on('roomJoined', handleJoin);

      // user 2 should receive the message
      clientSocket2.on('newMessage', (message) => {
        expect(message.content).toBe('Hello from User 1');
        expect(message.sender.firstName).toBe('User');
        expect(message.sender.lastName).toBe('One');
        expect(message.chatRoom.toString()).toBe(testRoom._id.toString());
        done();
      });
    });

    // Incorrect partition 1: User sends to a room they are not a member of
    it('should reject message from non-participant', (done) => {
      const port = httpServer.address().port;

      // create a room where user2 is NOT a participant
      ChatRoom.create({
        name: 'Private Room',
        creator: testUser1._id,
        participants: [testUser1._id], // only user1
      }).then((privateRoom) => {
        clientSocket2 = Client(`http://localhost:${port}`, {
          auth: { token: token2 },
        });

        clientSocket2.on('connect', () => {
          // user2 tries to send to private room
          clientSocket2.emit('sendMessage', {
            content: 'Trying to infiltrate',
            roomId: privateRoom._id.toString(),
          });
        });

        clientSocket2.on('error', (error) => {
          expect(error.message).toContain('not a participant');
          done();
        });
      });
    });

    // Incorrect partition 2: User sends with an invalid/expired JWT over WebSocket
    it('should reject connection with invalid token', (done) => {
      const port = httpServer.address().port;

      const invalidClient = Client(`http://localhost:${port}`, {
        auth: { token: 'invalid-token-xyz' },
      });

      invalidClient.on('connect_error', (error) => {
        expect(error.message).toContain('Invalid authentication token');
        invalidClient.disconnect();
        done();
      });
    });

    // Incorrect partition 3: User sends without authentication token
    it('should reject connection without authentication token', (done) => {
      const port = httpServer.address().port;

      const unauthClient = Client(`http://localhost:${port}`, {
        auth: {},
      });

      unauthClient.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication required');
        unauthClient.disconnect();
        done();
      });
    });
  });

  describe('WebSocket Disconnect and Reconnect', () => {
    it.skip('should handle disconnect gracefully without data loss', (done) => {
      const port = httpServer.address().port;

      clientSocket1 = Client(`http://localhost:${port}`, {
        auth: { token: token1 },
      });

      clientSocket1.on('connect', () => {
        clientSocket1.emit('joinRoom', testRoom._id.toString());
      });

      clientSocket1.on('roomJoined', () => {
        // disconnect
        clientSocket1.disconnect();

        // wait a bit and reconnect
        setTimeout(() => {
          clientSocket1.connect();

          clientSocket1.on('connect', () => {
            // rejoin room
            clientSocket1.emit('joinRoom', testRoom._id.toString());
          });

          clientSocket1.on('roomJoined', () => {
            // successfully reconnected
            expect(clientSocket1.connected).toBe(true);
            done();
          });
        }, 100);
      });
    });
  });

  describe('Wrong-Room Isolation Test', () => {
    it.skip('should not broadcast messages to users in different rooms', (done) => {
      const port = httpServer.address().port;

      // create second room with only user2
      ChatRoom.create({
        name: 'Room Y',
        creator: testUser2._id,
        participants: [testUser2._id],
      }).then((roomY) => {
        clientSocket1 = Client(`http://localhost:${port}`, {
          auth: { token: token1 },
        });

        clientSocket2 = Client(`http://localhost:${port}`, {
          auth: { token: token2 },
        });

        let connectedCount = 0;

        const handleConnect = () => {
          connectedCount++;
          if (connectedCount === 2) {
            // user1 joins testRoom, user2 joins roomY
            clientSocket1.emit('joinRoom', testRoom._id.toString());
            clientSocket2.emit('joinRoom', roomY._id.toString());
          }
        };

        clientSocket1.on('connect', handleConnect);
        clientSocket2.on('connect', handleConnect);

        let joinedCount = 0;

        const handleJoin = () => {
          joinedCount++;
          if (joinedCount === 2) {
            // user1 sends message to testRoom
            clientSocket1.emit('sendMessage', {
              content: 'Message in Room X',
              roomId: testRoom._id.toString(),
            });

            // wait briefly to ensure no message is received
            setTimeout(() => {
              done();
            }, 200);
          }
        };

        clientSocket1.on('joinedRoom', handleJoin);
        clientSocket2.on('joinedRoom', handleJoin);

        // user2 should NOT receive the message
        clientSocket2.on('newMessage', () => {
          done(new Error('User2 should not receive message from different room'));
        });
      });
    });
  });
});
