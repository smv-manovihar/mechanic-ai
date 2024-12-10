const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const validateSession = require('../components/validateSession');

// Create a new chat session
// request body = { userId,  message }
// returns = { success, sessionId, response, replacmentParts, carModel, error }
router.post('/new', chatController.createSession);

// To get response in already existing chat session
// request body = { userId, sessionId, message }
// returns = { success, response, replacmentParts, carModel, error }
router.post('/message', validateSession, chatController.addMessage);

// To get a chat session's history
// request body = { userId, sessionId }
// returns = { success, conversation : [...<messages>], error }
router.post('/history', validateSession, chatController.getHistory);

// To get user's chats
// request body structure  = { userId, offset }
// returns = { chatList : [...{ sessionId , title, error }]}
router.post('/chats',chatController.getChats);

// Let's the frontend change the title of the chat
// request body structure = { userId, sessionId, title }
// returns = { success, title, error}
router.post('/title',chatController.renameTitle);

// Allows deletion of chats from database
// request body = { userId, sessionId }
// returns = { error }
router.post('/delete',chatController.deleteChat);
module.exports = router;