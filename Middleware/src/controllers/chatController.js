const { v4: uuidv4 } = require('uuid');
const { getChatModel } = require('../components/chatSession');
const axios = require("axios");
const llm_url = process.env.LLM;

const chatController = {
  createSession: async (req, res) => {
    try {
      const { userId, message } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      
      const sessionId = uuidv4();
      const ChatModel = getChatModel(userId);
      const title = "New Chat";
      
      const newSession = new ChatModel({
        userId,
        sessionId,
        title,
        conversation: []
      });
      await newSession.save();

      // Update conversation with user's message
      await updateConvo(userId, sessionId, 'user', message);

      // Generate LLM response (wait for the response)
      const data = await generate(userId, sessionId, message, true);

      res.status(201).json({ 
        success: true,
        sessionId,
        response: data, // LLM response data
        message: 'New chat session created'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create chat session' });
    }
  },

  addMessage: async (req, res) => {
    try {
      const { userId, sessionId, message } = req.body;
      
      if (!userId || !sessionId || !message) {
        return res.status(400).json({ error: 'Invalid message format' });
      }

      // Update conversation with user's message
      await updateConvo(userId, sessionId, 'user', message);

      // Generate LLM response (wait for the response)
      const data = await generate(userId, sessionId, message, false);

      res.status(200).json({ 
        success: true,
        response: data, // LLM response data
        message: 'Messages added successfully'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to add message' });
    }
  },

  getHistory: async (req, res) => {
    try {
      const { userId, sessionId } = req.body;
      const ChatModel = getChatModel(userId);
      const data = await ChatModel.findOne({sessionId});
      res.status(200).json({
        success: true,
        conversation: data.conversation
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  },

  getChats: async (req, res) => {
    try {
      const { userId } = req;
      const ChatModel = getChatModel(userId);
      const chats = await ChatModel.find({},{_id:0,title:1,sessionId:1});
      console.log(chats);

      res.status(200).json({ chatList: chats });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch chats' });
    }
  }
};

// Helper functions
async function updateConvo(userId, sessionId, sender, message) {
  const ChatModel = getChatModel(userId);
  await ChatModel.updateOne(
    { sessionId },
    {
      $push: {
        conversation: {
          sender,
          message,
          timestamp: new Date()
        }
      }
    }
  );
}

async function generate(userId, sessionId, message, newSession) {
  try {
    const response = await axios.post(llm_url, {
      prompt: message,
      new: newSession
    });

    const data = response.data;
    
    if (newSession) {
      const ChatModel = getChatModel(userId);
      await ChatModel.updateOne(
        { sessionId },
        {
          title: data.title
        }
      );
    }

    await updateConvo(userId, sessionId, 'bot', data.response);
    return data.response;
  } catch (error) {
    console.error("Error in LLM server", error);
    return "Oops! Something went wrong.";
  }
}

module.exports = chatController;
