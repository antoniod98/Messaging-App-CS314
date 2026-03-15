const express = require('express');
const router = express.Router();
const { ChatRoom, Message, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const {
  deleteRoomImage,
  getRoomImageUrl,
  saveRoomImageFromDataUrl,
} = require('../utils/roomImage');

const dedupeParticipants = (participants) => {
  const seenParticipantIds = new Set();

  return participants.filter((participant) => {
    const participantId = (participant._id || participant.id).toString();
    if (seenParticipantIds.has(participantId)) {
      return false;
    }

    seenParticipantIds.add(participantId);
    return true;
  });
};

const serializeRoom = (req, room, currentUserId = null) => {
  const uniqueParticipants = dedupeParticipants(room.participants);
  let displayName = room.name;

  if (room.isDM && currentUserId) {
    const otherParticipant = uniqueParticipants.find(
      (participant) => participant._id.toString() !== currentUserId.toString()
    );

    if (otherParticipant) {
      displayName = `${otherParticipant.firstName} ${otherParticipant.lastName}`;
    }
  }

  return {
    id: room._id,
    name: displayName,
    isDM: room.isDM || false,
    roomImageUrl: room.isDM ? null : getRoomImageUrl(req, room.imagePath),
    creator: {
      id: room.creator._id || room.creator,
      firstName: room.creator.firstName,
      lastName: room.creator.lastName,
      email: room.creator.email,
    },
    participants: uniqueParticipants.map((participant) => ({
      id: participant._id,
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
    })),
    participantCount: uniqueParticipants.length,
    createdAt: room.createdAt,
  };
};

// POST /api/rooms/dm - create or get direct message with another user (protected route)
router.post('/dm', authenticate, async (req, res) => {
  try {
    const { userId: otherUserId } = req.body;
    const currentUserId = req.user.userId;

    // validation: check if other user ID is provided
    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // validation: cannot DM yourself
    if (otherUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a direct message with yourself',
      });
    }

    // verify the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // find or create DM
    const dm = await ChatRoom.findOrCreateDM(currentUserId, otherUserId);

    // get the other participant (not the current user)
    const uniqueParticipants = dedupeParticipants(dm.participants);
    const otherParticipant = uniqueParticipants.find(
      (p) => p._id.toString() !== currentUserId.toString()
    );

    res.status(200).json({
      success: true,
      message: 'Direct message ready',
      room: {
        id: dm._id,
        name: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
        isDM: true,
        creator: {
          id: dm.creator,
        },
        participants: uniqueParticipants.map((p) => ({
          id: p._id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
        })),
        participantCount: uniqueParticipants.length,
        createdAt: dm.createdAt,
      },
    });
  } catch (error) {
    console.error('Create DM error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating direct message',
    });
  }
});

// POST /api/rooms - create a new chat room (protected route)
router.post('/', authenticate, async (req, res) => {
  let savedRoomImagePath = null;

  try {
    const { name, roomImage } = req.body;
    const userId = req.user.userId;

    // validation: check if room name is provided
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required',
      });
    }

    // validation: check room name length
    if (name.length < 3 || name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Room name must be between 3 and 50 characters',
      });
    }

    // check if room name already exists
    const existingRoom = await ChatRoom.findOne({ name: name.trim() });
    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: 'A room with this name already exists',
      });
    }

    if (roomImage) {
      savedRoomImagePath = await saveRoomImageFromDataUrl(roomImage);
    }

    // create new chat room with authenticated user as creator
    const newRoom = new ChatRoom({
      name: name.trim(),
      imagePath: savedRoomImagePath,
      creator: userId,
      participants: [userId], // creator is automatically a participant
    });

    await newRoom.save();

    // populate creator details before sending response
    await newRoom.populate('creator', 'firstName lastName email');
    await newRoom.populate('participants', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Chat room created successfully',
      room: serializeRoom(req, newRoom, userId),
    });
  } catch (error) {
    console.error('Create room error:', error);

    if (savedRoomImagePath) {
      await deleteRoomImage(savedRoomImagePath);
    }

    // handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating room',
    });
  }
});

// GET /api/rooms - get all chat rooms user participates in (protected route)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // find all rooms where user is a participant
    const rooms = await ChatRoom.find({ participants: userId })
      .populate('creator', 'firstName lastName email')
      .populate('participants', 'firstName lastName email')
      .sort({ createdAt: -1 }); // most recent first

    res.status(200).json({
      success: true,
      rooms: rooms.map((room) => serializeRoom(req, room, userId)),
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rooms',
    });
  }
});

// GET /api/rooms/:id - get details of a specific chat room (protected route)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const room = await ChatRoom.findById(id)
      .populate('creator', 'firstName lastName email')
      .populate('participants', 'firstName lastName email');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    // verify user is a participant of this room
    if (!room.hasParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this room',
      });
    }

    res.status(200).json({
      success: true,
      room: serializeRoom(req, room, userId),
    });
  } catch (error) {
    console.error('Get room details error:', error);

    // handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching room details',
    });
  }
});

// DELETE /api/rooms/:id - delete a chat room (protected route, creator only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const room = await ChatRoom.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    // verify user is the creator of this room
    if (room.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the room creator can delete this room',
      });
    }

    // delete all messages in this room (cascade delete)
    await Message.deleteMany({ chatRoom: id });
    await deleteRoomImage(room.imagePath);

    // delete the room
    await ChatRoom.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Chat room and all messages deleted successfully',
      deletedRoomId: id,
    });
  } catch (error) {
    console.error('Delete room error:', error);

    // handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting room',
    });
  }
});

// POST /api/rooms/:id/participants - add participant to room (protected route)
router.post('/:id/participants', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: newParticipantId } = req.body;
    const requesterId = req.user.userId;

    // validation: check required fields
    if (!newParticipantId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const room = await ChatRoom.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    // verify requester is a participant
    if (!room.hasParticipant(requesterId)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a participant to add users',
      });
    }

    // check if user already a participant
    if (room.hasParticipant(newParticipantId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a participant',
      });
    }

    // verify the new participant exists
    const { User } = require('../models');
    const newUser = await User.findById(newParticipantId);
    if (!newUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // add participant (addParticipant method already saves)
    await room.addParticipant(newParticipantId);

    res.status(200).json({
      success: true,
      message: 'Participant added successfully',
      participant: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Add participant error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding participant',
    });
  }
});

// PUT /api/rooms/:id/image - update a room image (protected route, creator only)
router.put('/:id/image', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { roomImage, removeRoomImage } = req.body;
    const userId = req.user.userId;

    const room = await ChatRoom.findById(id)
      .populate('creator', 'firstName lastName email')
      .populate('participants', 'firstName lastName email');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    if (room.isDM) {
      return res.status(400).json({
        success: false,
        message: 'Direct messages do not support room images',
      });
    }

    if (room.creator._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the room creator can update the room image',
      });
    }

    if (!roomImage && !removeRoomImage) {
      return res.status(400).json({
        success: false,
        message: 'A new room image or remove request is required',
      });
    }

    if (removeRoomImage) {
      await deleteRoomImage(room.imagePath);
      room.imagePath = null;
    }

    if (roomImage) {
      const previousImagePath = room.imagePath;
      const nextImagePath = await saveRoomImageFromDataUrl(roomImage);
      room.imagePath = nextImagePath;

      if (previousImagePath && previousImagePath !== nextImagePath) {
        await deleteRoomImage(previousImagePath);
      }
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: 'Room image updated successfully',
      room: serializeRoom(req, room, userId),
    });
  } catch (error) {
    console.error('Update room image error:', error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating room image',
    });
  }
});

// DELETE /api/rooms/:id/participants/:userId - remove participant (protected route)
router.delete('/:id/participants/:userId', authenticate, async (req, res) => {
  try {
    const { id, userId: participantId } = req.params;
    const requesterId = req.user.userId;

    const room = await ChatRoom.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    // only creator can remove participants
    if (room.creator.toString() !== requesterId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the room creator can remove participants',
      });
    }

    // cannot remove the creator
    if (room.creator.toString() === participantId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the room creator',
      });
    }

    // check if user is a participant
    if (!room.hasParticipant(participantId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not a participant',
      });
    }

    // remove participant (removeParticipant method already saves)
    await room.removeParticipant(participantId);

    res.status(200).json({
      success: true,
      message: 'Participant removed successfully',
      removedUserId: participantId,
    });
  } catch (error) {
    console.error('Remove participant error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while removing participant',
    });
  }
});

// GET /api/rooms/:roomId/messages - get message history for a chat room (protected route)
router.get('/:roomId/messages', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    // pagination parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters (page >= 1, limit 1-100)',
      });
    }

    // verify chat room exists
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    // verify user is a participant of the chat room
    if (!chatRoom.hasParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this chat room',
      });
    }

    // calculate pagination offset
    const skip = (page - 1) * limit;

    // get total message count for pagination metadata
    const totalMessages = await Message.countDocuments({ chatRoom: roomId });
    const totalPages = Math.ceil(totalMessages / limit);

    // fetch paginated messages sorted by timestamp ascending (oldest first)
    const messages = await Message.find({ chatRoom: roomId })
      .sort({ timestamp: 1 }) // chronological order (oldest first)
      .skip(skip)
      .limit(limit)
      .populate('sender', 'firstName lastName email')
      .lean(); // convert to plain JavaScript objects for better performance

    res.status(200).json({
      success: true,
      messages: messages.map((msg) => ({
        id: msg._id,
        content: msg.content,
        sender: msg.sender,
        chatRoom: msg.chatRoom,
        timestamp: msg.timestamp,
      })),
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalMessages: totalMessages,
        messagesPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);

    // handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages',
    });
  }
});

module.exports = router;
