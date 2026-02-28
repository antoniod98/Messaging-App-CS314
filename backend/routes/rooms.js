const express = require('express');
const router = express.Router();
const { ChatRoom, Message } = require('../models');
const { authenticate } = require('../middleware/auth');

// POST /api/rooms - create a new chat room (protected route)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
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

    // create new chat room with authenticated user as creator
    const newRoom = new ChatRoom({
      name: name.trim(),
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
      room: {
        id: newRoom._id,
        name: newRoom.name,
        creator: {
          id: newRoom.creator._id,
          firstName: newRoom.creator.firstName,
          lastName: newRoom.creator.lastName,
          email: newRoom.creator.email,
        },
        participants: newRoom.participants.map((p) => ({
          id: p._id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
        })),
        createdAt: newRoom.createdAt,
      },
    });
  } catch (error) {
    console.error('Create room error:', error);

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
      rooms: rooms.map((room) => ({
        id: room._id,
        name: room.name,
        creator: {
          id: room.creator._id,
          firstName: room.creator.firstName,
          lastName: room.creator.lastName,
          email: room.creator.email,
        },
        participants: room.participants.map((p) => ({
          id: p._id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
        })),
        participantCount: room.participants.length,
        createdAt: room.createdAt,
      })),
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
      room: {
        id: room._id,
        name: room.name,
        creator: {
          id: room.creator._id,
          firstName: room.creator.firstName,
          lastName: room.creator.lastName,
          email: room.creator.email,
        },
        participants: room.participants.map((p) => ({
          id: p._id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
        })),
        participantCount: room.participants.length,
        createdAt: room.createdAt,
      },
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

module.exports = router;
