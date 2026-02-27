const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Chat room name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Chat room name must be at least 3 characters'],
      maxlength: [50, 'Chat room name cannot exceed 50 characters'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Chat room must have a creator'],
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// indexes for performance
chatRoomSchema.index({ name: 1 }); // fast room name lookups
chatRoomSchema.index({ creator: 1 }); // fast lookup of rooms created by user
chatRoomSchema.index({ participants: 1 }); // fast lookup of rooms user belongs to

// pre-save middleware: auto-add creator to participants if not already included
chatRoomSchema.pre('save', function (next) {
  if (!this.participants.includes(this.creator)) {
    this.participants.push(this.creator);
  }
  next();
});

// instance method to check if user is participant
chatRoomSchema.methods.hasParticipant = function (userId) {
  return this.participants.some(
    (participant) => participant.toString() === userId.toString()
  );
};

// instance method to add participant
chatRoomSchema.methods.addParticipant = function (userId) {
  if (!this.hasParticipant(userId)) {
    this.participants.push(userId);
  }
  return this.save();
};

// instance method to remove participant
chatRoomSchema.methods.removeParticipant = function (userId) {
  this.participants = this.participants.filter(
    (participant) => participant.toString() !== userId.toString()
  );
  return this.save();
};

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;
