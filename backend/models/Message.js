const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Message must have a sender'],
    },
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: [true, 'Message must belong to a chat room'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// speed up message queries
messageSchema.index({ chatRoom: 1, timestamp: -1 });
messageSchema.index({ sender: 1, timestamp: -1 });

// grab the latest messages from a room
messageSchema.statics.getRecentMessages = function (roomId, limit = 50) {
  return this.find({ chatRoom: roomId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('sender', 'firstName lastName email')
    .exec();
};

// get messages with pagination
messageSchema.statics.getPaginatedMessages = function (
  roomId,
  page = 1,
  limit = 50
) {
  const skip = (page - 1) * limit;
  return this.find({ chatRoom: roomId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'firstName lastName email')
    .exec();
};

// count how many messages are in a room
messageSchema.statics.countRoomMessages = function (roomId) {
  return this.countDocuments({ chatRoom: roomId });
};

// check if this message was sent by a specific user
messageSchema.methods.belongsToUser = function (userId) {
  return this.sender.toString() === userId.toString();
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
