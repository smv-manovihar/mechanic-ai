const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const validateSession = require("../components/validateSession");

// Create a new chat session
// request body = { userId,  message }
// returns = { success, sessionId, error}
// http status codes: {
// success: {
//      201: Chat session created.
//  }
// errors:{
//      503 : LLM server down (No retry),
//      500 : Express server error (Give regenerate option)
//  }
//}
router.post("/new", chatController.createSession);

// To get response in already existing chat session
// request body = { userId, sessionId, message }
// returns = { success, response, title, urls, error }
// urls array structure = [{name,url}, null(if part is not available)]
// http status codes: {
// success: {
//      200: Message added.
//  }
// errors:{
//      503 : LLM server down (No retry),
//      500 : Express server error (Give regenerate option)
//  }
//}
router.post("/message", validateSession, chatController.addMessage);

// To get a chat session's history
// request body = { userId, sessionId }
// returns = { success, conversation : [{sender = ["user","bot"],message,timestamp}...] }
// http status codes: {
// success: {
//      200: successfully fetched the conversation
//  }
// errors:{
//      500 : Did not get the conversation
//  }
//}
router.post("/history", validateSession, chatController.getHistory);

// To get user's chats
// request body structure  = { userId, offset }
// returns = { chatList : [{ sessionId , title, offset }...]}
// http status codes: {
// success: {
//      200: successfully fetched the chats
//  }
// errors:{
//      500 : Did not get the chats
//  }
//}
router.post("/chats", chatController.getChats);

// Let's the frontend change the title of the chat
// request body structure = { userId, sessionId, title }
// returns = { success, title, error}
// http status codes: {
// success: {
//      200: successfully changed the title
//  }
// errors:{
//      500 : Did not change the title
//  }
//}
router.post("/title", chatController.renameTitle);

// Allows deletion of chats from database
// request body = { userId, sessionId }
// returns = { success ,sessionId, error }
// http status codes: {
// success: {
//      200: successfully deleted the chat
//  }
// errors:{
//      500 : Did not delete the title.
//  }
//}
router.post("/delete", chatController.deleteChat);
module.exports = router;
