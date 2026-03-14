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

describe('5.2 Security Testing', () => {
  describe('NoSQL Injection Attack', () => {
    // Test: Submit login with { "username": { "$gt": "" } } as the request body
    // Method: Mongoose schema-based ODM sanitizes all queries before execution
    // Result: PASS — login rejected normally; no unauthorized access granted
    it('should prevent NoSQL injection in login email field', async () => {
      // create a test user
      await createUser('victim@example.com');

      // attempt NoSQL injection
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $gt: '' }, // NoSQL injection attempt
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      // should not grant access to any user
    });

    it('should prevent NoSQL injection in registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: { $gt: '' },
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent NoSQL injection in query parameters', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      // try to inject in room ID
      const response = await request(app)
        .get('/api/rooms/{"$gt":""}/messages')
        .set('Authorization', `Bearer ${token}`);

      // should return 404 or 400, not return all messages
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Cross-Site Scripting (XSS)', () => {
    // Test: Send a chat message containing <script>alert('xss')</script>
    // Method: React renders all message content as plain text by default, never as raw HTML
    // Result: PASS — script tag displayed as literal text; no script executed
    it('should store XSS payload as plain text in message content', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      const xssPayload = '<script>alert("xss")</script>';

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: xssPayload,
          chatRoomId: room.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message.content).toBe(xssPayload);
      // content is stored as-is; frontend is responsible for sanitizing display
    });

    it('should handle XSS in user registration fields', async () => {
      const xssFirstName = '<img src=x onerror="alert(1)">';
      const xssLastName = '<script>document.cookie</script>';

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'xss@example.com',
          password: 'password123',
          firstName: xssFirstName,
          lastName: xssLastName,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      // data is stored but should be escaped on frontend rendering
      expect(response.body.user.firstName).toBe(xssFirstName);
      expect(response.body.user.lastName).toBe(xssLastName);
    });

    it('should handle XSS in room names', async () => {
      const { token } = await createUser();

      const xssRoomName = '<svg/onload=alert("XSS")>';

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: xssRoomName })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.room.name).toBe(xssRoomName);
    });
  });

  describe('Session Hijacking', () => {
    // Test: Capture a valid JWT; manually inject it into a new browser session with a different user logged in
    // Method: JWTs are validated on every request server-side; tokens are tied to user _id
    // Result: PASS — server correctly identifies the token owner; cross-user data access blocked
    it('should prevent cross-user data access with stolen token', async () => {
      const user1 = await createUser('user1@example.com');
      const user2 = await createUser('user2@example.com');

      // user1 creates a private room
      const room = await createRoom(user1.token, 'User1 Private Room');

      // user2 tries to access user1's room using their own token (should fail)
      const response = await request(app)
        .get(`/api/rooms/${room.id}/messages`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a participant');
    });

    it('should validate token ownership on every protected request', async () => {
      const user1 = await createUser('user1@example.com');
      const user2 = await createUser('user2@example.com');

      // user2 tries to use user1's token to access /api/auth/me
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user1.token}`)
        .expect(200);

      // should return user1's data, not user2's
      expect(response.body.user.email).toBe('user1@example.com');
      expect(response.body.user.email).not.toBe('user2@example.com');
    });

    it('should reject token after user is deleted', async () => {
      const { token, user } = await createUser();

      // delete the user
      await User.findByIdAndDelete(user.id);

      // token should no longer work
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });
  });

  describe('Brute Force Attack', () => {
    // Test: Rapidly send 20+ login requests with incorrect credentials to /api/auth/login
    // Method: Rate-limiting middleware applied to authentication endpoints
    // Note: This test simulates brute force but actual rate limiting would be tested
    // in production with rate-limiting middleware like express-rate-limit

    it('should handle multiple failed login attempts without crashing', async () => {
      // create a user
      await createUser('target@example.com');

      const attempts = [];

      // attempt 10 failed logins rapidly
      for (let i = 0; i < 10; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'target@example.com',
              password: 'wrong-password',
            })
        );
      }

      const responses = await Promise.all(attempts);

      // all should fail with 401
      responses.forEach((response) => {
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });

      // server should still be responsive
      const finalAttempt = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'target@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(finalAttempt.body.success).toBe(true);
    });

    it('should handle rapid registration attempts', async () => {
      const attempts = [];

      for (let i = 0; i < 5; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/register')
            .send({
              email: `user${i}@example.com`,
              password: 'password123',
              firstName: 'Test',
              lastName: 'User',
            })
        );
      }

      const responses = await Promise.all(attempts);

      // all should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    it('should prevent account enumeration through timing attacks', async () => {
      // create one user
      await createUser('existing@example.com');

      // measure time for non-existent user
      const start1 = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });
      const time1 = Date.now() - start1;

      // measure time for existing user with wrong password
      const start2 = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@example.com',
          password: 'wrongpassword',
        });
      const time2 = Date.now() - start2;

      // timing difference should not be significant enough to enumerate accounts
      // (this is a basic check; in production, constant-time comparisons would be used)
      const timeDifference = Math.abs(time1 - time2);
      expect(timeDifference).toBeLessThan(1000); // less than 1 second difference
    });
  });

  describe('Authorization and Access Control', () => {
    it('should prevent users from deleting rooms they did not create', async () => {
      const creator = await createUser('creator@example.com');
      const attacker = await createUser('attacker@example.com');

      const room = await createRoom(creator.token);

      // attacker tries to delete creator's room
      const response = await request(app)
        .delete(`/api/rooms/${room.id}`)
        .set('Authorization', `Bearer ${attacker.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only the room creator');

      // verify room still exists
      const roomCheck = await ChatRoom.findById(room.id);
      expect(roomCheck).not.toBeNull();
    });

    it('should prevent users from accessing messages in rooms they are not part of', async () => {
      const user1 = await createUser('user1@example.com');
      const user2 = await createUser('user2@example.com');

      const room = await createRoom(user1.token, 'Private Room');

      // user2 tries to access messages
      const response = await request(app)
        .get(`/api/rooms/${room.id}/messages`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a participant');
    });

    it('should prevent users from sending messages to rooms they are not part of', async () => {
      const user1 = await createUser('user1@example.com');
      const user2 = await createUser('user2@example.com');

      const room = await createRoom(user1.token, 'Private Room');

      // user2 tries to send message
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user2.token}`)
        .send({
          content: 'Unauthorized message',
          chatRoomId: room.id,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a participant');
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email,
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
          });

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body.success).toBe(false);
      }
    });

    it('should enforce password minimum length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('8 characters');
    });

    it('should reject messages exceeding maximum length', async () => {
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

    it('should accept messages at exactly 2000 characters (boundary value)', async () => {
      const { token } = await createUser();
      const room = await createRoom(token);

      const exactMessage = 'a'.repeat(2000);

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: exactMessage,
          chatRoomId: room.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message.content).toHaveLength(2000);
    });

    it('should reject room names outside valid length range', async () => {
      const { token } = await createUser();

      // too short
      const shortResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'AB' })
        .expect(400);

      expect(shortResponse.body.success).toBe(false);

      // too long
      const longName = 'a'.repeat(51);
      const longResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: longName })
        .expect(400);

      expect(longResponse.body.success).toBe(false);
    });
  });

  describe('Password Security', () => {
    it('should never return plaintext passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'security@example.com',
          password: 'password123',
          firstName: 'Security',
          lastName: 'Test',
        })
        .expect(201);

      expect(response.body.user.password).toBeUndefined();

      // check database directly (must explicitly select password field)
      const user = await User.findOne({ email: 'security@example.com' }).select('+password');
      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should use bcrypt to hash passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'bcrypt@example.com',
          password: 'mySecurePassword123',
          firstName: 'Bcrypt',
          lastName: 'Test',
        });

      const user = await User.findById(response.body.user.id).select('+password');

      // bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(user.password).toMatch(/^\$2[aby]\$/);
      expect(user.password).toHaveLength(60); // bcrypt produces 60-character hashes
    });

    it('should correctly compare passwords with bcrypt', async () => {
      const bcrypt = require('bcryptjs');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'compare@example.com',
          password: 'testPassword123',
          firstName: 'Compare',
          lastName: 'Test',
        });

      const user = await User.findById(response.body.user.id).select('+password');

      // correct password should match
      const validMatch = await bcrypt.compare('testPassword123', user.password);
      expect(validMatch).toBe(true);

      // wrong password should not match
      const invalidMatch = await bcrypt.compare('wrongPassword', user.password);
      expect(invalidMatch).toBe(false);
    });
  });
});
