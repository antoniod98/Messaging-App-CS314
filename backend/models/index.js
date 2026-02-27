// central export file for all models
// this makes imports cleaner: const { User, ChatRoom, Message } = require('./models');

const User = require('./User');
const ChatRoom = require('./ChatRoom');
const Message = require('./Message');

module.exports = {
  User,
  ChatRoom,
  Message,
};
