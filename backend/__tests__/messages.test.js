const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('../routes/auth');
const roomRoutes = require('../routes/rooms');
const messageRoutes = require('../routes/messages');
const { User, ChatRoom, Message } = require('../models');

// create express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

// clear database after each test
afterEach(async () => {
  await User.deleteMany({});
  await ChatRoom.deleteMany({});
  await Message.deleteMany({});
});

// helper function to create and login a test user
const createUser = async (email = 'test@example.com') => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });

  return {
    user: response.body.user,
    token: response.body.token,
  };
};

// helper function to create a test room
const createRoom = async (token, roomName = 'Test Room') => {
  const response = await request(app)
    .post('/api/rooms')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: roomName });

  return response.body.room;
};

describe('Message Routes', () => {
  describe('POST /api/messages', () => {
    // unit test: send message with valid data
    it('should send a new message to a chat room', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Hello, this is a test message!',
          chatRoomId: room.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message.content).toBe('Hello, this is a test message!');
      expect(response.body.message.sender).toBeDefined();
      expect(response.body.message.chatRoom).toBe(room.id);
      expect(response.body.message.timestamp).toBeDefined();
    });

    // unit test: validation - empty message content
    it('should reject empty message content', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '',
          chatRoomId: room.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    // unit test: validation - whitespace-only message
    it('should reject whitespace-only message content', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '   ',
          chatRoomId: room.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cannot be empty');
    });

    // unit test: validation - message exceeds max length
    it('should reject message exceeding 2000 characters', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      const longMessage = 'a'.repeat(2001);

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: longMessage,
          chatRoomId: room.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('2000 characters');
    });

    // unit test: validation - missing chatRoomId
    it('should reject message without chatRoomId', async () => {
      const { token } = await createUser();

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Test message',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Chat room ID is required');
    });

    // unit test: validation - chat room not found
    it('should reject message to non-existent chat room', async () => {
      const { token } = await createUser();
      const fakeRoomId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Test message',
          chatRoomId: fakeRoomId,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    // security test: only participants can send messages
    it('should prevent non-participants from sending messages', async () => {
      const creator = await createUser('creator@example.com');
      const outsider = await createUser('outsider@example.com');

      const room = await createRoom(creator.token);

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${outsider.token}`)
        .send({
          content: 'Trying to send message',
          chatRoomId: room.id,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a participant');
    });

    // security test: require authentication
    it('should reject message sending without auth token', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      const response = await request(app)
        .post('/api/messages')
        .send({
          content: 'Test message',
          chatRoomId: room.id,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // unit test: trim whitespace from message content
    it('should trim whitespace from message content', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '  Hello World  ',
          chatRoomId: room.id,
        })
        .expect(201);

      expect(response.body.message.content).toBe('Hello World');
    });

    // security test: XSS prevention in message content
    it('should handle XSS attempts in message content', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      const xssContent = '<script>alert("XSS")</script>';

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: xssContent,
          chatRoomId: room.id,
        })
        .expect(201);

      // message should be stored as-is (sanitization happens on frontend display)
      expect(response.body.success).toBe(true);
      expect(response.body.message.content).toBeDefined();
    });
  });

  describe('GET /api/rooms/:roomId/messages', () => {
    // unit test: retrieve message history
    it('should retrieve message history for a chat room', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      // send 3 messages
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Message 1', chatRoomId: room.id });

      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Message 2', chatRoomId: room.id });

      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Message 3', chatRoomId: room.id });

      const response = await request(app)
        .get(`/api/rooms/${room.id}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.messages).toHaveLength(3);
      expect(response.body.messages[0].content).toBe('Message 1');
      expect(response.body.messages[2].content).toBe('Message 3');
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalMessages).toBe(3);
    });

    // unit test: pagination - default values
    it('should use default pagination values (page 1, limit 50)', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      const response = await request(app)
        .get(`/api/rooms/${room.id}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.messagesPerPage).toBe(50);
    });

    // unit test: pagination - custom values
    it('should support custom pagination parameters', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      // create 10 messages
      for (let i = 1; i <= 10; i++) {
        await request(app)
          .post('/api/messages')
          .set('Authorization', `Bearer ${token}`)
          .send({ content: `Message ${i}`, chatRoomId: room.id });
      }

      const response = await request(app)
        .get(`/api/rooms/${room.id}/messages?page=2&limit=5`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.messages).toHaveLength(5);
      expect(response.body.pagination.currentPage).toBe(2);
      expect(response.body.pagination.messagesPerPage).toBe(5);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.hasPreviousPage).toBe(true);
      expect(response.body.pagination.hasNextPage).toBe(false);
    });

    // unit test: validation - invalid pagination parameters
    it('should reject invalid pagination parameters', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      const response = await request(app)
        .get(`/api/rooms/${room.id}/messages?page=0&limit=200`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid pagination');
    });

    // security test: only participants can view messages
    it('should prevent non-participants from viewing messages', async () => {
      const creator = await createUser('creator@example.com');
      const outsider = await createUser('outsider@example.com');

      const room = await createRoom(creator.token);

      const response = await request(app)
        .get(`/api/rooms/${room.id}/messages`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a participant');
    });

    // unit test: chat room not found
    it('should return 404 for non-existent chat room', async () => {
      const { token } = await createUser();
      const fakeRoomId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/rooms/${fakeRoomId}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    // security test: require authentication
    it('should reject message retrieval without auth token', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      const response = await request(app)
        .get(`/api/rooms/${room.id}/messages`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // unit test: chronological message ordering
    it('should return messages in chronological order (oldest first)', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      // send messages with delays to ensure different timestamps
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'First message', chatRoomId: room.id });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Second message', chatRoomId: room.id });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Third message', chatRoomId: room.id });

      const response = await request(app)
        .get(`/api/rooms/${room.id}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.messages[0].content).toBe('First message');
      expect(response.body.messages[1].content).toBe('Second message');
      expect(response.body.messages[2].content).toBe('Third message');

      // verify timestamps are in ascending order
      const timestamp1 = new Date(response.body.messages[0].timestamp);
      const timestamp2 = new Date(response.body.messages[1].timestamp);
      const timestamp3 = new Date(response.body.messages[2].timestamp);

      expect(timestamp2.getTime()).toBeGreaterThan(timestamp1.getTime());
      expect(timestamp3.getTime()).toBeGreaterThan(timestamp2.getTime());
    });

    // unit test: empty message history
    it('should return empty array for room with no messages', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      const response = await request(app)
        .get(`/api/rooms/${room.id}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.messages).toHaveLength(0);
      expect(response.body.pagination.totalMessages).toBe(0);
      expect(response.body.pagination.totalPages).toBe(0);
    });
  });
});
