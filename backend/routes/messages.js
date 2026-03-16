const express = require('express');
const router = express.Router();
const { Message, ChatRoom } = require('../models');
const { authenticate } = require('../middleware/auth');
const { getProfileImageUrl } = require('../utils/profileImage');

// POST /api/messages - send a new message to a chat room (protected route)
router.post('/', authenticate, async (req, res) => {
  try {
    const { content, chatRoomId } = req.body;
    const userId = req.user.userId;

    // validation: check if content is provided
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    // validation: check if content is not just whitespace
    if (content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty',
      });
    }

    // validation: check message length
    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 2000 characters',
      });
    }

    // validation: check if chatRoomId is provided
    if (!chatRoomId) {
      return res.status(400).json({
        success: false,
        message: 'Chat room ID is required',
      });
    }

    // verify chat room exists
    const chatRoom = await ChatRoom.findById(chatRoomId);
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

    // create new message
    const newMessage = new Message({
      content: content.trim(),
      sender: userId,
      chatRoom: chatRoomId,
      timestamp: new Date(),
    });

    await newMessage.save();

    // populate sender details before sending response
    await newMessage.populate('sender', 'firstName lastName email profileImagePath');

    res.status(201).json({
      success: true,
      message: {
        id: newMessage._id,
        content: newMessage.content,
        sender: {
          id: newMessage.sender._id,
          firstName: newMessage.sender.firstName,
          lastName: newMessage.sender.lastName,
          email: newMessage.sender.email,
          profileImageUrl: getProfileImageUrl(req, newMessage.sender.profileImagePath),
        },
        chatRoom: newMessage.chatRoom,
        timestamp: newMessage.timestamp,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);

    // handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    // handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat room ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while sending message',
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

    // fetch paginated messages sorted by timestamp descending (newest first in DB)
    // then reverse in memory to send oldest first for display
    const messages = await Message.find({ chatRoom: roomId })
      .sort({ timestamp: -1 }) // get newest first from DB
      .skip(skip)
      .limit(limit)
      .populate('sender', 'firstName lastName email profileImagePath')
      .lean(); // convert to plain JavaScript objects for better performance

    // reverse array to send oldest first (chronological order for chat display)
    messages.reverse();

    res.status(200).json({
      success: true,
      messages: messages.map((msg) => ({
        id: msg._id,
        content: msg.content,
        sender: {
          id: msg.sender._id,
          firstName: msg.sender.firstName,
          lastName: msg.sender.lastName,
          email: msg.sender.email,
          profileImageUrl: getProfileImageUrl(req, msg.sender.profileImagePath),
        },
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
