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
    imagePath: {
      type: String,
      default: null,
      trim: true,
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

// indexes to speed up common queries
chatRoomSchema.index({ creator: 1 });
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ isDM: 1, participants: 1 });

// make sure creator is always in participants and no duplicates
chatRoomSchema.pre('save', function () {
  const normalizedParticipants = [];
  const seenParticipantIds = new Set();

  this.participants.forEach((participant) => {
    const participantId = participant.toString();
    if (!seenParticipantIds.has(participantId)) {
      seenParticipantIds.add(participantId);
      normalizedParticipants.push(participant);
    }
  });

  const creatorId = this.creator.toString();
  if (!seenParticipantIds.has(creatorId)) {
    normalizedParticipants.push(this.creator);
  }

  this.participants = normalizedParticipants;
});

// check if a user is in this room
chatRoomSchema.methods.hasParticipant = function (userId) {
  return this.participants.some((participant) => {
    // participant might be a full User object or just an ID
    const participantId = participant._id || participant;
    return participantId.toString() === userId.toString();
  });
};

// add someone to the room
chatRoomSchema.methods.addParticipant = function (userId) {
  if (!this.hasParticipant(userId)) {
    this.participants.push(userId);
  }
  return this.save();
};

// kick someone out
chatRoomSchema.methods.removeParticipant = function (userId) {
  this.participants = this.participants.filter(
    (participant) => participant.toString() !== userId.toString()
  );
  return this.save();
};

// find existing DM or create a new one
chatRoomSchema.statics.findOrCreateDM = async function (userId1, userId2) {
  // sort IDs so the lookup is consistent regardless of who initiates
  const userIds = [userId1.toString(), userId2.toString()].sort();

  // see if these two already have a DM
  const existingDM = await this.findOne({
    isDM: true,
    participants: { $all: userIds, $size: 2 },
  }).populate('participants', 'firstName lastName email');

  if (existingDM) {
    return existingDM;
  }

  // nope, make a new one
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
