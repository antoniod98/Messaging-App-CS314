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
  });
});
