const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('../routes/auth');
const { User } = require('../models');

// create express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// clear database after each test
afterEach(async () => {
  await User.deleteMany({});
});

describe('Authentication Routes', () => {
  describe('POST /api/auth/register', () => {
    // unit test: successful registration
    it('should register a new user with valid credentials', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.password).toBeUndefined(); // password should not be returned
    });

    // unit test: validation - missing fields
    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    // unit test: validation - invalid email format
    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    // unit test: validation - password too short
    it('should reject registration with password less than 8 characters', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'short',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('8 characters');
    });

    // security test: prevent duplicate email registration
    it('should reject registration with existing email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      // first registration
      await request(app).post('/api/auth/register').send(userData).expect(201);

      // attempt duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    // security test: XSS prevention in user input
    it('should handle XSS attempts in firstName', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: '<script>alert("XSS")</script>',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // user data is stored as-is (sanitization happens on frontend display)
      expect(response.body.success).toBe(true);
      expect(response.body.user.firstName).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    // unit test: successful login
    it('should login with valid credentials', async () => {
      // create test user
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      await request(app).post('/api/auth/register').send(userData);

      // attempt login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
    });

    // unit test: reject invalid credentials
    it('should reject login with wrong password', async () => {
      // create test user
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      await request(app).post('/api/auth/register').send(userData);

      // attempt login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    // unit test: reject non-existent user
    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // security test: SQL injection attempt
    it('should prevent SQL injection in email field', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "admin' OR '1'='1",
          password: 'password',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // security test: brute force protection (rate limiting would be tested here)
    it('should handle multiple failed login attempts', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(userData);

        expect(response.body.success).toBe(false);
      }
      // Note: rate limiting would prevent excessive attempts in production
    });
  });

  describe('GET /api/auth/me', () => {
    // integration test: verify JWT authentication
    it('should return user data with valid JWT token', async () => {
      // create and login user
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      const token = registerResponse.body.token;

      // verify token works
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(userData.email);
    });

    // security test: reject invalid token
    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // security test: reject request without token
    it('should reject request without authentication token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out');
    });
  });
});
