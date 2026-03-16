const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('../routes/auth');
const roomRoutes = require('../routes/rooms');
const { User, ChatRoom, Message } = require('../models');

// create express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

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

describe('Room Routes', () => {
  describe('POST /api/rooms', () => {
    // unit test: create room with valid data
    it('should create a new chat room', async () => {
      const { token } = await createUser();

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Room' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.room.name).toBe('Test Room');
      expect(response.body.room.creator).toBeDefined();
      expect(response.body.room.participants).toHaveLength(1);
    });

    // unit test: validation - name too short
    it('should reject room name less than 3 characters', async () => {
      const { token } = await createUser();

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'AB' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('between 3 and 50 characters');
    });

    // unit test: prevent duplicate room names
    it('should reject duplicate room names', async () => {
      const { token } = await createUser();

      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Room' });

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Room' })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    // security test: require authentication
    it('should reject room creation without auth token', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({ name: 'Test Room' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/rooms', () => {
    // unit test: list user's rooms
    it('should return all rooms user participates in', async () => {
      const { token, user } = await createUser();

      // create rooms
      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Room 1' });

      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Room 2' });

      const response = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.rooms).toHaveLength(2);
    });

    // unit test: only return user's rooms
    it('should only return rooms where user is participant', async () => {
      const user1 = await createUser('user1@example.com');
      const user2 = await createUser('user2@example.com');

      // user1 creates a room
      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ name: 'User 1 Room' });

      // user2 gets their rooms (should be empty)
      const response = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(200);

      expect(response.body.rooms).toHaveLength(0);
    });
  });

  describe('DELETE /api/rooms/:id', () => {
    // unit test: creator can delete room
    it('should allow creator to delete their room', async () => {
      const { token } = await createUser();

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Room' });

      const roomId = createResponse.body.room.id;

      const response = await request(app)
        .delete(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deletedRoomId).toBe(roomId);

      // verify room is deleted
      const room = await ChatRoom.findById(roomId);
      expect(room).toBeNull();
    });

    // security test: non-creator cannot delete room
    it('should prevent non-creator from deleting room', async () => {
      const creator = await createUser('creator@example.com');
      const other = await createUser('other@example.com');

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ name: 'Test Room' });

      const roomId = createResponse.body.room.id;

      const response = await request(app)
        .delete(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${other.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only the room creator');
    });

    // unit test: cascade delete messages
    it('should delete all messages when room is deleted', async () => {
      const { token } = await createUser();

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Room' });

      const roomId = createResponse.body.room.id;

      // create messages manually
      await Message.create({
        content: 'Test message',
        sender: new mongoose.Types.ObjectId(),
        chatRoom: roomId,
      });

      // delete room
      await request(app)
        .delete(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${token}`);

      // verify messages are deleted
      const messages = await Message.find({ chatRoom: roomId });
      expect(messages).toHaveLength(0);
    });
  });

  describe('POST /api/rooms/:id/participants', () => {
    // unit test: add participant to room
    it('should allow participant to add another user to room', async () => {
      const creator = await createUser('creator@example.com');
      const newUser = await createUser('newuser@example.com');

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ name: 'Test Room' });

      const roomId = createResponse.body.room.id;

      const response = await request(app)
        .post(`/api/rooms/${roomId}/participants`)
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ userId: newUser.user.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.participant.email).toBe(newUser.user.email);
    });

    // security test: prevent adding same user twice
    it('should prevent adding user who is already a participant', async () => {
      const creator = await createUser('creator@example.com');

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ name: 'Test Room' });

      const roomId = createResponse.body.room.id;

      const response = await request(app)
        .post(`/api/rooms/${roomId}/participants`)
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ userId: creator.user.id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already a participant');
    });
  });

  describe('DELETE /api/rooms/:id/participants/:userId', () => {
    // security test: only creator can remove participants
    it('should only allow creator to remove participants', async () => {
      const creator = await createUser('creator@example.com');
      const participant = await createUser('participant@example.com');
      const other = await createUser('other@example.com');

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ name: 'Test Room' });

      const roomId = createResponse.body.room.id;

      // add participant
      await request(app)
        .post(`/api/rooms/${roomId}/participants`)
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ userId: participant.user.id });

      // add other user
      await request(app)
        .post(`/api/rooms/${roomId}/participants`)
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ userId: other.user.id });

      // other user tries to remove participant (should fail)
      const response = await request(app)
        .delete(`/api/rooms/${roomId}/participants/${participant.user.id}`)
        .set('Authorization', `Bearer ${other.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only the room creator');
    });

    // unit test: creator can remove participants
    it('should allow creator to remove participant', async () => {
      const creator = await createUser('creator@example.com');
      const participant = await createUser('participant@example.com');

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ name: 'Test Room' });

      const roomId = createResponse.body.room.id;

      // add participant
      await request(app)
        .post(`/api/rooms/${roomId}/participants`)
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ userId: participant.user.id });

      // remove participant
      const response = await request(app)
        .delete(`/api/rooms/${roomId}/participants/${participant.user.id}`)
        .set('Authorization', `Bearer ${creator.token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    // security test: cannot remove creator
    it('should prevent removing the room creator', async () => {
      const creator = await createUser('creator@example.com');

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ name: 'Test Room' });

      const roomId = createResponse.body.room.id;

      const response = await request(app)
        .delete(`/api/rooms/${roomId}/participants/${creator.user.id}`)
        .set('Authorization', `Bearer ${creator.token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot remove the room creator');
    });
  });

  describe('POST /api/rooms/dm', () => {
    // unit test: create DM with valid user
    it('should create a new DM between two users', async () => {
      const user1 = await createUser('user1@example.com');
      const user2 = await createUser('user2@example.com');

      const response = await request(app)
        .post('/api/rooms/dm')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ userId: user2.user.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Direct message ready');
      expect(response.body.room.isDM).toBe(true);
      expect(response.body.room.participantCount).toBe(2);
    });

    // unit test: return existing DM if already exists
    it('should return existing DM if one already exists', async () => {
      const user1 = await createUser('user1@example.com');
      const user2 = await createUser('user2@example.com');

      const response1 = await request(app)
        .post('/api/rooms/dm')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ userId: user2.user.id });

      const response2 = await request(app)
        .post('/api/rooms/dm')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ userId: user2.user.id });

      expect(response1.body.room.id).toBe(response2.body.room.id);
    });

    // unit test: DM works regardless of user order
    it('should return same DM regardless of who initiates', async () => {
      const user1 = await createUser('user1@example.com');
      const user2 = await createUser('user2@example.com');

      const response1 = await request(app)
        .post('/api/rooms/dm')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ userId: user2.user.id });

      const response2 = await request(app)
        .post('/api/rooms/dm')
        .set('Authorization', `Bearer ${user2.token}`)
        .send({ userId: user1.user.id });

      expect(response1.body.room.id).toBe(response2.body.room.id);
    });

    // validation test: reject missing userId
    it('should reject DM creation without userId', async () => {
      const user = await createUser();

      const response = await request(app)
        .post('/api/rooms/dm')
        .set('Authorization', `Bearer ${user.token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User ID is required');
    });

    // validation test: cannot DM yourself
    it('should prevent user from DMing themselves', async () => {
      const user = await createUser();

      const response = await request(app)
        .post('/api/rooms/dm')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ userId: user.user.id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot create a direct message with yourself');
    });

    // validation test: user not found
    it('should reject DM with non-existent user', async () => {
      const user = await createUser();
      const fakeUserId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post('/api/rooms/dm')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ userId: fakeUserId })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    // validation test: invalid user ID format
    it('should reject DM with invalid user ID format', async () => {
      const user = await createUser();

      const response = await request(app)
        .post('/api/rooms/dm')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ userId: 'invalid-id' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID format');
    });

    // security test: require authentication
    it('should reject DM creation without auth token', async () => {
      const user = await createUser();

      const response = await request(app)
        .post('/api/rooms/dm')
        .send({ userId: user.user.id })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/rooms/:id', () => {
    // unit test: get room details
    it('should return room details for participant', async () => {
      const { token } = await createUser();

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Room' });

      const roomId = createResponse.body.room.id;

      const response = await request(app)
        .get(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.room.id).toBe(roomId);
      expect(response.body.room.name).toBe('Test Room');
    });

    // security test: prevent non-participants from viewing room
    it('should prevent non-participants from viewing room details', async () => {
      const creator = await createUser('creator@example.com');
      const outsider = await createUser('outsider@example.com');

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ name: 'Test Room' });

      const roomId = createResponse.body.room.id;

      const response = await request(app)
        .get(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a participant');
    });

    // unit test: room not found
    it('should return 404 for non-existent room', async () => {
      const { token } = await createUser();
      const fakeRoomId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/rooms/${fakeRoomId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Chat room not found');
    });

    // validation test: invalid room ID format
    it('should return 400 for invalid room ID format', async () => {
      const { token } = await createUser();

      const response = await request(app)
        .get(`/api/rooms/invalid-id`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid room ID format');
    });
  });

  describe('PUT /api/rooms/:id/image', () => {
    // unit test: update room image
    it('should allow creator to update room image', async () => {
      const { token } = await createUser();

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Room' });

      const roomId = createResponse.body.room.id;

      const response = await request(app)
        .put(`/api/rooms/${roomId}/image`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Room image updated successfully');
    });

    // unit test: remove room image
    it('should allow creator to remove room image', async () => {
      const { token } = await createUser();

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Room',
          roomImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        });

      const roomId = createResponse.body.room.id;

      const response = await request(app)
        .put(`/api/rooms/${roomId}/image`)
        .set('Authorization', `Bearer ${token}`)
        .send({ removeRoomImage: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.room.roomImageUrl).toBeNull();
    });

    // security test: prevent non-creator from updating image
    it('should prevent non-creator from updating room image', async () => {
      const creator = await createUser('creator@example.com');
      const other = await createUser('other@example.com');

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ name: 'Test Room' });

      const roomId = createResponse.body.room.id;

      await request(app)
        .post(`/api/rooms/${roomId}/participants`)
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ userId: other.user.id });

      const response = await request(app)
        .put(`/api/rooms/${roomId}/image`)
        .set('Authorization', `Bearer ${other.token}`)
        .send({ roomImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only the room creator');
    });

    // validation test: prevent DM image updates
    it('should prevent updating image for DMs', async () => {
      const user1 = await createUser('user1@example.com');
      const user2 = await createUser('user2@example.com');

      const dmResponse = await request(app)
        .post('/api/rooms/dm')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ userId: user2.user.id });

      const roomId = dmResponse.body.room.id;

      const response = await request(app)
        .put(`/api/rooms/${roomId}/image`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ roomImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Direct messages do not support room images');
    });

    // validation test: require image or remove flag
    it('should require roomImage or removeRoomImage', async () => {
      const { token } = await createUser();

      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Room' });

      const roomId = createResponse.body.room.id;

      const response = await request(app)
        .put(`/api/rooms/${roomId}/image`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    // unit test: room not found
    it('should return 404 for non-existent room', async () => {
      const { token } = await createUser();
      const fakeRoomId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/rooms/${fakeRoomId}/image`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Chat room not found');
    });
  });

  describe('GET /api/rooms/:roomId/messages', () => {
    // validation test: invalid room ID format
    it('should return 400 for invalid room ID format', async () => {
      const { token } = await createUser();

      const response = await request(app)
        .get(`/api/rooms/invalid-id/messages`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid room ID format');
    });
  });

  describe('POST /api/rooms/:id/participants', () => {
    // validation test: invalid room ID format
    it('should return 400 for invalid room ID format', async () => {
      const { token } = await createUser();

      const response = await request(app)
        .post(`/api/rooms/invalid-id/participants`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: new mongoose.Types.ObjectId() })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid ID format');
    });

    // validation test: room not found
    it('should return 404 for non-existent room', async () => {
      const user = await createUser();
      const fakeRoomId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/rooms/${fakeRoomId}/participants`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ userId: new mongoose.Types.ObjectId() })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Chat room not found');
    });

    // validation test: user not found
    it('should return 404 when adding non-existent user', async () => {
      const creator = await createUser();
      const room = await createRoom(creator.token);
      const fakeUserId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/rooms/${room.id}/participants`)
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ userId: fakeUserId })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    // security test: non-participant cannot add users
    it('should prevent non-participant from adding users', async () => {
      const creator = await createUser('creator@example.com');
      const outsider = await createUser('outsider@example.com');
      const room = await createRoom(creator.token);

      const response = await request(app)
        .post(`/api/rooms/${room.id}/participants`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .send({ userId: new mongoose.Types.ObjectId() })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('must be a participant');
    });
  });

  describe('DELETE /api/rooms/:id/participants/:userId', () => {
    // validation test: invalid room ID format
    it('should return 400 for invalid room ID format', async () => {
      const { token } = await createUser();

      const response = await request(app)
        .delete(`/api/rooms/invalid-id/participants/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid ID format');
    });

    // validation test: room not found
    it('should return 404 for non-existent room', async () => {
      const user = await createUser();
      const fakeRoomId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/rooms/${fakeRoomId}/participants/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Chat room not found');
    });

    // validation test: user not a participant
    it('should return 400 when removing non-participant', async () => {
      const creator = await createUser('creator@example.com');
      const other = await createUser('other@example.com');
      const room = await createRoom(creator.token);

      const response = await request(app)
        .delete(`/api/rooms/${room.id}/participants/${other.user.id}`)
        .set('Authorization', `Bearer ${creator.token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User is not a participant');
    });
  });

  describe('DELETE /api/rooms/:id', () => {
    // validation test: invalid room ID format
    it('should return 400 for invalid room ID format', async () => {
      const { token } = await createUser();

      const response = await request(app)
        .delete(`/api/rooms/invalid-id`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid room ID format');
    });

    // validation test: room not found
    it('should return 404 for non-existent room', async () => {
      const { token } = await createUser();
      const fakeRoomId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/rooms/${fakeRoomId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Chat room not found');
    });
  });
});
