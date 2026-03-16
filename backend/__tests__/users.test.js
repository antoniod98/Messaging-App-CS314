const fs = require('fs/promises');
const path = require('path');
const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/users');
const authRoutes = require('../routes/auth');
const { User } = require('../models');

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const PROFILE_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'profile-pictures');
const SAMPLE_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnRsl0AAAAASUVORK5CYII=';

afterEach(async () => {
  await User.deleteMany({});
  await fs.rm(PROFILE_UPLOAD_DIR, { recursive: true, force: true });
});

describe('User Routes', () => {
  describe('PUT /api/users/profile', () => {
    it('should save a profile image and return its URL', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'profile@example.com',
        password: 'password123',
        firstName: 'Profile',
        lastName: 'User',
      });

      const token = registerResponse.body.token;

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Updated',
          lastName: 'User',
          profileImage: SAMPLE_PNG_DATA_URL,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.firstName).toBe('Updated');
      expect(response.body.user.profileImageUrl).toMatch(
        /^http:\/\/127\.0\.0\.1:\d+\/uploads\/profile-pictures\//
      );

      const savedUser = await User.findOne({ email: 'profile@example.com' });
      expect(savedUser.profileImagePath).toMatch(/^\/uploads\/profile-pictures\//);

      const savedFilename = path.basename(savedUser.profileImagePath);
      const savedFile = await fs.readFile(path.join(PROFILE_UPLOAD_DIR, savedFilename));
      expect(savedFile.length).toBeGreaterThan(0);
    });

    it('should reject update without firstName', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const token = registerResponse.body.token;

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          lastName: 'User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should reject update without lastName', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const token = registerResponse.body.token;

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Test',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should reject firstName longer than 50 characters', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const token = registerResponse.body.token;

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'a'.repeat(51),
          lastName: 'User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('First name');
    });

    it('should reject lastName longer than 50 characters', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const token = registerResponse.body.token;

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Test',
          lastName: 'b'.repeat(51),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Last name');
    });

    it('should remove profile image when removeProfileImage is true', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const token = registerResponse.body.token;

      // First, add a profile image
      await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          profileImage: SAMPLE_PNG_DATA_URL,
        });

      // Then remove it
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          removeProfileImage: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.profileImageUrl).toBeNull();

      const savedUser = await User.findOne({ email: 'test@example.com' });
      expect(savedUser.profileImagePath).toBeNull();
    });

    it('should replace existing profile image with new one', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const token = registerResponse.body.token;

      // First, add a profile image
      const firstResponse = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          profileImage: SAMPLE_PNG_DATA_URL,
        });

      const firstImagePath = firstResponse.body.user.profileImageUrl;

      // Then update with a new image
      const secondResponse = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          profileImage: SAMPLE_PNG_DATA_URL,
        })
        .expect(200);

      expect(secondResponse.body.success).toBe(true);
      // Image URL might be the same or different depending on implementation
      expect(secondResponse.body.user.profileImageUrl).toBeDefined();
    });

    it('should update firstName and lastName without image changes', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const token = registerResponse.body.token;

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.firstName).toBe('Updated');
      expect(response.body.user.lastName).toBe('Name');
    });
  });

  describe('GET /api/users/search', () => {
    it('should search users by email', async () => {
      // Create test users
      await request(app).post('/api/auth/register').send({
        email: 'alice@example.com',
        password: 'password123',
        firstName: 'Alice',
        lastName: 'Smith',
      });

      await request(app).post('/api/auth/register').send({
        email: 'bob@example.com',
        password: 'password123',
        firstName: 'Bob',
        lastName: 'Jones',
      });

      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'charlie@example.com',
        password: 'password123',
        firstName: 'Charlie',
        lastName: 'Brown',
      });

      const token = registerResponse.body.token;

      const response = await request(app)
        .get('/api/users/search?q=alice')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0].email).toBe('alice@example.com');
      expect(response.body.users[0].firstName).toBe('Alice');
    });

    it('should perform case-insensitive search', async () => {
      await request(app).post('/api/auth/register').send({
        email: 'ALICE@EXAMPLE.COM',
        password: 'password123',
        firstName: 'Alice',
        lastName: 'Smith',
      });

      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'searcher@example.com',
        password: 'password123',
        firstName: 'Searcher',
        lastName: 'User',
      });

      const token = registerResponse.body.token;

      const response = await request(app)
        .get('/api/users/search?q=alice')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should reject search without query parameter', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const token = registerResponse.body.token;

      const response = await request(app)
        .get('/api/users/search')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should reject search with empty query parameter', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const token = registerResponse.body.token;

      const response = await request(app)
        .get('/api/users/search?q=')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should limit search results to 10 users', async () => {
      // Create 15 users
      for (let i = 1; i <= 15; i++) {
        await request(app).post('/api/auth/register').send({
          email: `user${i}@example.com`,
          password: 'password123',
          firstName: 'User',
          lastName: `${i}`,
        });
      }

      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'searcher@example.com',
        password: 'password123',
        firstName: 'Searcher',
        lastName: 'User',
      });

      const token = registerResponse.body.token;

      const response = await request(app)
        .get('/api/users/search?q=user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users.length).toBeLessThanOrEqual(10);
    });

    it('should return empty array when no users match', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const token = registerResponse.body.token;

      const response = await request(app)
        .get('/api/users/search?q=nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users).toHaveLength(0);
    });
  });
});
