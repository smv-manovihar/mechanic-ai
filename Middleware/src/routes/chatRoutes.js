const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const validateSession = require('../components/validateSession');

// Create a new chat session
// request body = { userId,  message }
// returns = { success, sessionId, title, response, replacmentParts, carModel }
router.post('/new', chatController.createSession);

// To get response in already existing chat session
// request body = { userId, sessionId, message }
// returns = { success, response, replacmentParts, carModel }
router.post('/message', validateSession, chatController.addMessage);

// To get a chat session's history
// request body = { userId, sessionId }
// returns = { success, conversation : [...<messages>] }
router.post('/history', validateSession, chatController.getHistory);

// To get user's chats
// request body structure  = { userId }
// returns = { chatList : [...{ sessionId , title }]}
router.post('/chats',chatController.getChats);
module.exports = router;