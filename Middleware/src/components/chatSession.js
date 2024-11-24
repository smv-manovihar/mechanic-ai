const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  title: { type: String, required: true},
  conversation: [{
    sender: { type: String, enum: ['user', 'bot'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]},{
  timestamps:true // createdAt, updatedAt
});

const getChatModel = (userId) => {
  const collectionName = `user_${userId}_chats`;
  return mongoose.model(collectionName, chatSessionSchema, collectionName);
};

module.exports = { getChatModel };