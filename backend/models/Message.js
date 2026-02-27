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

// compound index for efficient message retrieval by room and time
messageSchema.index({ chatRoom: 1, timestamp: -1 }); // -1 for descending (newest first)
messageSchema.index({ sender: 1, timestamp: -1 }); // for user message history

// static method to get recent messages for a room
messageSchema.statics.getRecentMessages = function (roomId, limit = 50) {
  return this.find({ chatRoom: roomId })
    .sort({ timestamp: -1 }) // most recent first
    .limit(limit)
    .populate('sender', 'firstName lastName email') // populate sender info
    .exec();
};

// static method to get paginated messages
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

// static method to count messages in a room
messageSchema.statics.countRoomMessages = function (roomId) {
  return this.countDocuments({ chatRoom: roomId });
};

// instance method to check if message belongs to user
messageSchema.methods.belongsToUser = function (userId) {
  return this.sender.toString() === userId.toString();
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
