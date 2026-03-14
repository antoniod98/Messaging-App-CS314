const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: function() {
        // name is only required for group chats, not DMs
        return !this.isDM;
      },
      trim: true,
      minlength: [3, 'Chat room name must be at least 3 characters'],
      maxlength: [50, 'Chat room name cannot exceed 50 characters'],
    },
    isDM: {
      type: Boolean,
      default: false,
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
chatRoomSchema.index({ isDM: 1, participants: 1 }); // fast lookup of DMs between users

// pre-save middleware: auto-add creator to participants if not already included
chatRoomSchema.pre('save', function () {
  if (!this.participants.includes(this.creator)) {
    this.participants.push(this.creator);
  }
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

// static method to find or create a direct message between two users
chatRoomSchema.statics.findOrCreateDM = async function (userId1, userId2) {
  // normalize user IDs to ensure consistent ordering
  const userIds = [userId1.toString(), userId2.toString()].sort();

  // check if DM already exists between these two users
  const existingDM = await this.findOne({
    isDM: true,
    participants: { $all: userIds, $size: 2 },
  }).populate('participants', 'firstName lastName email');

  if (existingDM) {
    return existingDM;
  }

  // create new DM
  const newDM = await this.create({
    isDM: true,
    creator: userId1,
    participants: userIds,
  });

  await newDM.populate('participants', 'firstName lastName email');
  return newDM;
};

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;
