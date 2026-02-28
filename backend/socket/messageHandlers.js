const { ChatRoom, Message } = require('../models');

// register all message-related socket event handlers
function messageHandlers(io, socket) {
  // handle user joining a chat room
  socket.on('joinRoom', async (roomId) => {
    try {
      // verify room exists
      const room = await ChatRoom.findById(roomId);

      if (!room) {
        socket.emit('error', { message: 'Chat room not found' });
        return;
      }

      // verify user is a participant
      if (!room.hasParticipant(socket.userId)) {
        socket.emit('error', { message: 'You are not a participant of this room' });
        return;
      }

      // join the socket to the room namespace
      socket.join(roomId);

      console.log(`User ${socket.userEmail} joined room: ${room.name} (${roomId})`);

      // emit confirmation to user
      socket.emit('roomJoined', {
        roomId: roomId,
        roomName: room.name,
      });

      // notify other room participants that user joined
      socket.to(roomId).emit('userJoinedRoom', {
        roomId: roomId,
        userId: socket.userId,
        userEmail: socket.userEmail,
      });
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Error joining room' });
    }
  });

  // handle user leaving a chat room
  socket.on('leaveRoom', async (roomId) => {
    try {
      // leave the socket room namespace
      socket.leave(roomId);

      console.log(`User ${socket.userEmail} left room: ${roomId}`);

      // emit confirmation to user
      socket.emit('roomLeft', {
        roomId: roomId,
      });

      // notify other room participants that user left
      socket.to(roomId).emit('userLeftRoom', {
        roomId: roomId,
        userId: socket.userId,
        userEmail: socket.userEmail,
      });
    } catch (error) {
      console.error('Leave room error:', error);
      socket.emit('error', { message: 'Error leaving room' });
    }
  });

  // handle sending a message to a chat room
  socket.on('sendMessage', async (data) => {
    try {
      const { roomId, content } = data;

      // validation: check required fields
      if (!roomId || !content) {
        socket.emit('error', { message: 'Room ID and message content are required' });
        return;
      }

      // validation: check content is not just whitespace
      if (content.trim().length === 0) {
        socket.emit('error', { message: 'Message content cannot be empty' });
        return;
      }

      // validation: check message length
      if (content.length > 2000) {
        socket.emit('error', { message: 'Message cannot exceed 2000 characters' });
        return;
      }

      // verify room exists
      const room = await ChatRoom.findById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Chat room not found' });
        return;
      }

      // verify user is a participant
      if (!room.hasParticipant(socket.userId)) {
        socket.emit('error', { message: 'You are not a participant of this room' });
        return;
      }

      // create and save message to database
      const newMessage = new Message({
        content: content.trim(),
        sender: socket.userId,
        chatRoom: roomId,
        timestamp: new Date(),
      });

      await newMessage.save();

      // populate sender details
      await newMessage.populate('sender', 'firstName lastName email');

      // prepare message object for broadcast
      const messageData = {
        id: newMessage._id,
        content: newMessage.content,
        sender: {
          id: newMessage.sender._id,
          firstName: newMessage.sender.firstName,
          lastName: newMessage.sender.lastName,
          email: newMessage.sender.email,
        },
        chatRoom: newMessage.chatRoom,
        timestamp: newMessage.timestamp,
      };

      // broadcast message to all users in the room (including sender)
      io.to(roomId).emit('newMessage', messageData);

      console.log(`Message sent in room ${roomId} by ${socket.userEmail}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Error sending message' });
    }
  });

  // handle typing indicator
  socket.on('typing', async (data) => {
    try {
      const { roomId, isTyping } = data;

      if (!roomId) {
        return;
      }

      // verify room exists and user is participant
      const room = await ChatRoom.findById(roomId);
      if (!room || !room.hasParticipant(socket.userId)) {
        return;
      }

      // broadcast typing status to other room participants (not sender)
      socket.to(roomId).emit('userTyping', {
        roomId: roomId,
        userId: socket.userId,
        userEmail: socket.userEmail,
        isTyping: isTyping,
      });
    } catch (error) {
      console.error('Typing indicator error:', error);
      // silently fail for typing indicators (not critical)
    }
  });

  // handle room deletion notification
  socket.on('roomDeleted', (roomId) => {
    try {
      // notify all users in the room that it was deleted
      io.to(roomId).emit('roomDeleted', {
        roomId: roomId,
      });

      console.log(`Room ${roomId} deleted, notifications sent`);
    } catch (error) {
      console.error('Room deletion notification error:', error);
    }
  });
}

module.exports = messageHandlers;
