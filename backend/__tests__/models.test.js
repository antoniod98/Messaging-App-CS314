const mongoose = require('mongoose');
const { User, ChatRoom, Message } = require('../models');

// clear database after each test
afterEach(async () => {
  await User.deleteMany({});
  await ChatRoom.deleteMany({});
  await Message.deleteMany({});
});

describe('ChatRoom Model', () => {
  describe('findOrCreateDM static method', () => {
    it('should create a new DM if one does not exist', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'One',
      });

      const user2 = await User.create({
        email: 'user2@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'Two',
      });

      const dm = await ChatRoom.findOrCreateDM(user1._id, user2._id);

      expect(dm).toBeDefined();
      expect(dm.isDM).toBe(true);
      expect(dm.participants).toHaveLength(2);
      expect(dm.participants.map((p) => p._id.toString())).toContain(
        user1._id.toString()
      );
      expect(dm.participants.map((p) => p._id.toString())).toContain(
        user2._id.toString()
      );
    });

    it('should return existing DM if one already exists', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'One',
      });

      const user2 = await User.create({
        email: 'user2@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'Two',
      });

      const dm1 = await ChatRoom.findOrCreateDM(user1._id, user2._id);
      const dm2 = await ChatRoom.findOrCreateDM(user1._id, user2._id);

      expect(dm1._id.toString()).toBe(dm2._id.toString());

      // verify only one DM exists
      const allDMs = await ChatRoom.find({ isDM: true });
      expect(allDMs).toHaveLength(1);
    });

    it('should normalize user IDs regardless of order', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'One',
      });

      const user2 = await User.create({
        email: 'user2@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'Two',
      });

      const dm1 = await ChatRoom.findOrCreateDM(user1._id, user2._id);
      const dm2 = await ChatRoom.findOrCreateDM(user2._id, user1._id);

      expect(dm1._id.toString()).toBe(dm2._id.toString());
    });
  });

  describe('pre-save middleware', () => {
    it('should add creator to participants if not already present', async () => {
      const user = await User.create({
        email: 'creator@example.com',
        password: 'password123',
        firstName: 'Creator',
        lastName: 'User',
      });

      const room = await ChatRoom.create({
        name: 'Test Room',
        creator: user._id,
        participants: [], // creator not in participants
      });

      expect(room.participants).toHaveLength(1);
      expect(room.participants[0].toString()).toBe(user._id.toString());
    });

    it('should deduplicate participants', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'One',
      });

      const user2 = await User.create({
        email: 'user2@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'Two',
      });

      const room = await ChatRoom.create({
        name: 'Test Room',
        creator: user1._id,
        participants: [user1._id, user2._id, user1._id, user2._id], // duplicates
      });

      expect(room.participants).toHaveLength(2);
    });
  });

  describe('hasParticipant instance method', () => {
    it('should return true if user is a participant', async () => {
      const user = await User.create({
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const room = await ChatRoom.create({
        name: 'Test Room',
        creator: user._id,
        participants: [user._id],
      });

      expect(room.hasParticipant(user._id)).toBe(true);
    });

    it('should return false if user is not a participant', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'One',
      });

      const user2 = await User.create({
        email: 'user2@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'Two',
      });

      const room = await ChatRoom.create({
        name: 'Test Room',
        creator: user1._id,
        participants: [user1._id],
      });

      expect(room.hasParticipant(user2._id)).toBe(false);
    });
  });

  describe('addParticipant instance method', () => {
    it('should add a new participant to the room', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'One',
      });

      const user2 = await User.create({
        email: 'user2@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'Two',
      });

      const room = await ChatRoom.create({
        name: 'Test Room',
        creator: user1._id,
        participants: [user1._id],
      });

      await room.addParticipant(user2._id);

      expect(room.participants).toHaveLength(2);
      expect(room.hasParticipant(user2._id)).toBe(true);
    });

    it('should not add duplicate participants', async () => {
      const user = await User.create({
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const room = await ChatRoom.create({
        name: 'Test Room',
        creator: user._id,
        participants: [user._id],
      });

      await room.addParticipant(user._id);

      expect(room.participants).toHaveLength(1);
    });
  });

  describe('removeParticipant instance method', () => {
    it('should remove a participant from the room', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'One',
      });

      const user2 = await User.create({
        email: 'user2@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'Two',
      });

      const room = await ChatRoom.create({
        name: 'Test Room',
        creator: user1._id,
        participants: [user1._id, user2._id],
      });

      await room.removeParticipant(user2._id);

      expect(room.participants).toHaveLength(1);
      expect(room.hasParticipant(user2._id)).toBe(false);
    });
  });
});

describe('Message Model', () => {
  describe('getRecentMessages static method', () => {
    it('should retrieve recent messages for a room', async () => {
      const user = await User.create({
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const room = await ChatRoom.create({
        name: 'Test Room',
        creator: user._id,
        participants: [user._id],
      });

      await Message.create({
        content: 'Message 1',
        sender: user._id,
        chatRoom: room._id,
      });

      await Message.create({
        content: 'Message 2',
        sender: user._id,
        chatRoom: room._id,
      });

      const messages = await Message.getRecentMessages(room._id);

      expect(messages).toHaveLength(2);
    });

    it('should limit the number of messages returned', async () => {
      const user = await User.create({
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const room = await ChatRoom.create({
        name: 'Test Room',
        creator: user._id,
        participants: [user._id],
      });

      for (let i = 0; i < 60; i++) {
        await Message.create({
          content: `Message ${i}`,
          sender: user._id,
          chatRoom: room._id,
        });
      }

      const messages = await Message.getRecentMessages(room._id, 10);

      expect(messages).toHaveLength(10);
    });
  });

  describe('getPaginatedMessages static method', () => {
    it('should retrieve paginated messages for a room', async () => {
      const user = await User.create({
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const room = await ChatRoom.create({
        name: 'Test Room',
        creator: user._id,
        participants: [user._id],
      });

      for (let i = 0; i < 25; i++) {
        await Message.create({
          content: `Message ${i}`,
          sender: user._id,
          chatRoom: room._id,
        });
      }

      const page1 = await Message.getPaginatedMessages(room._id, 1, 10);
      const page2 = await Message.getPaginatedMessages(room._id, 2, 10);

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
    });
  });

  describe('countRoomMessages static method', () => {
    it('should count messages in a room', async () => {
      const user = await User.create({
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const room = await ChatRoom.create({
        name: 'Test Room',
        creator: user._id,
        participants: [user._id],
      });

      await Message.create({
        content: 'Message 1',
        sender: user._id,
        chatRoom: room._id,
      });

      await Message.create({
        content: 'Message 2',
        sender: user._id,
        chatRoom: room._id,
      });

      const count = await Message.countRoomMessages(room._id);

      expect(count).toBe(2);
    });
  });

  describe('belongsToUser instance method', () => {
    it('should return true if message belongs to user', async () => {
      const user = await User.create({
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const room = await ChatRoom.create({
        name: 'Test Room',
        creator: user._id,
        participants: [user._id],
      });

      const message = await Message.create({
        content: 'Test message',
        sender: user._id,
        chatRoom: room._id,
      });

      expect(message.belongsToUser(user._id)).toBe(true);
    });

    it('should return false if message does not belong to user', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'One',
      });

      const user2 = await User.create({
        email: 'user2@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'Two',
      });

      const room = await ChatRoom.create({
        name: 'Test Room',
        creator: user1._id,
        participants: [user1._id, user2._id],
      });

      const message = await Message.create({
        content: 'Test message',
        sender: user1._id,
        chatRoom: room._id,
      });

      expect(message.belongsToUser(user2._id)).toBe(false);
    });
  });
});

describe('User Model', () => {
  describe('fullName virtual property', () => {
    it('should return full name', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.fullName).toBe('John Doe');
    });
  });

  describe('toJSON transformation', () => {
    it('should not expose password in JSON', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.fullName).toBe('John Doe');
    });
  });
});
