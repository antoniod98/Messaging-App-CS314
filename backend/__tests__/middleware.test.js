const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { generateToken } = require('../utils/auth');
const { User } = require('../models');
const jwt = require('jsonwebtoken');

// create express app for testing
const app = express();
app.use(express.json());

// test route using authenticate middleware
app.get('/api/protected', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// test route using optionalAuth middleware
app.get('/api/optional', optionalAuth, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user || null,
  });
});

// clear database after each test
afterEach(async () => {
  await User.deleteMany({});
});

// helper function to create a test user
const createUser = async () => {
  const user = new User({
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'Test',
    lastName: 'User',
  });
  await user.save();
  return user;
};

describe('Authentication Middleware', () => {
  describe('authenticate middleware', () => {
    // unit test: valid token in Authorization header
    it('should allow access with valid Bearer token', async () => {
      const user = await createUser();
      const token = generateToken({ userId: user._id, email: user.email });

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.userId).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.firstName).toBe('Test');
      expect(response.body.user.lastName).toBe('User');
    });

    // security test: reject request without token
    it('should reject request without authentication token', async () => {
      const response = await request(app).get('/api/protected').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication required');
    });

    // security test: reject invalid token
    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token-format')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid authentication token');
    });

    // security test: reject expired token
    it('should reject expired token', async () => {
      const user = await createUser();
      const expiredToken = generateToken(
        { userId: user._id, email: user.email },
        '0s' // expires immediately
      );

      // wait to ensure token expires
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session expired');
    });

    // security test: reject token with non-existent user
    it('should reject token for deleted/non-existent user', async () => {
      const user = await createUser();
      const token = generateToken({ userId: user._id, email: user.email });

      // delete the user
      await User.deleteMany({});

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    // security test: reject malformed Authorization header
    it('should reject malformed Authorization header', async () => {
      const user = await createUser();
      const token = generateToken({ userId: user._id, email: user.email });

      // missing 'Bearer ' prefix
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', token)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication required');
    });

    // security test: reject token signed with wrong secret
    it('should reject token signed with incorrect secret', async () => {
      const user = await createUser();

      // create token with wrong secret
      const fakeToken = jwt.sign(
        { userId: user._id, email: user.email },
        'wrong-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid authentication token');
    });

    // security test: reject token with missing userId
    it('should reject token with missing userId in payload', async () => {
      const token = generateToken({ email: 'test@example.com' }); // no userId

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // unit test: attach user info to request object
    it('should attach user info to request object', async () => {
      const user = await createUser();
      const token = generateToken({ userId: user._id, email: user.email });

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.userId).toBeDefined();
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user.firstName).toBe(user.firstName);
      expect(response.body.user.lastName).toBe(user.lastName);
    });

    // security test: token tampering detection
    it('should detect tampered token payload', async () => {
      const user = await createUser();
      const token = generateToken({ userId: user._id, email: user.email });

      // tamper with token by modifying payload section
      const parts = token.split('.');
      const tamperedPayload = Buffer.from(
        JSON.stringify({ userId: 'malicious-id', email: 'hacker@evil.com' })
      ).toString('base64');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid authentication token');
    });
  });

  describe('optionalAuth middleware', () => {
    // unit test: attach user with valid token
    it('should attach user info when valid token is provided', async () => {
      const user = await createUser();
      const token = generateToken({ userId: user._id, email: user.email });

      const response = await request(app)
        .get('/api/optional')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).not.toBeNull();
      expect(response.body.user.email).toBe(user.email);
    });

    // unit test: allow access without token
    it('should allow access without token (user is null)', async () => {
      const response = await request(app).get('/api/optional').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeNull();
    });

    // unit test: silently fail with invalid token
    it('should silently fail with invalid token and allow access', async () => {
      const response = await request(app)
        .get('/api/optional')
        .set('Authorization', 'Bearer invalid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeNull();
    });

    // unit test: silently fail with expired token
    it('should silently fail with expired token and allow access', async () => {
      const user = await createUser();
      const expiredToken = generateToken(
        { userId: user._id, email: user.email },
        '0s'
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/optional')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeNull();
    });

    // unit test: handle deleted user gracefully
    it('should handle deleted user gracefully', async () => {
      const user = await createUser();
      const token = generateToken({ userId: user._id, email: user.email });

      await User.deleteMany({});

      const response = await request(app)
        .get('/api/optional')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeNull();
    });
  });
});
