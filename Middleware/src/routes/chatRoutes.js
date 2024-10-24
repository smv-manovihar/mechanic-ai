const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const validateSession = require('../components/validateSession');

router.post('/new', chatController.createSession);
router.post('/message', validateSession, chatController.addMessage);
router.post('/history', validateSession, chatController.getHistory);
router.post('/chats',chatController.getChats)
module.exports = router;