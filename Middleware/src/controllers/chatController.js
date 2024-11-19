const { v4: uuidv4 } = require("uuid");
const { getChatModel } = require("../components/chatSession");
const axios = require("axios");
const llm_url = process.env.LLM;

const chatController = {
  // Creates a new session
  // Adds a new document in database with the sessionId
  // Sends the user's prompt to the LLM Server
  // Adds the LLM's response to the conversation of the session
  // request body = { userId,  message }
  // returns = { success, sessionId, response }
  createSession: async (req, res) => {
    try {
      const { userId, message } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const sessionId = uuidv4();
      const ChatModel = getChatModel(userId);
      const title = "New Chat";

      const newSession = new ChatModel({
        userId,
        sessionId,
        title,
        conversation: [],
      });
      await newSession.save();

      // Update conversation with user's message
      await updateConvo(userId, sessionId, "user", message);

      // Generate LLM response (wait for the response)
      const data = await generate(userId, sessionId, message, true);

      res.status(201).json({
        success: true,
        sessionId,
        response: data, // LLM response data
        message: "New chat session created",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create chat session" });
    }
  },
  // Adds the user's prompt to the already existing session in the database
  // Sends the user's prompt to the LLM Server
  // Adds the LLM's response to the conversation of the session
  // request body = { userId, sessionId, message }
  // returns = { success, response }
  addMessage: async (req, res) => {
    try {
      const { userId, sessionId, message } = req.body;

      if (!userId || !sessionId || !message) {
        return res.status(400).json({ error: "Invalid message format" });
      }

      // Update conversation with user's message
      await updateConvo(userId, sessionId, "user", message);

      // Generate LLM response (wait for the response)
      const data = await generate(userId, sessionId, message, false);

      res.status(200).json({
        success: true,
        response: data.response, // LLM response data
        replacementParts: data.replacementParts,
        carModel:data.carModel,
        message: "Messages added successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add message" });
    }
  },
  // Get a chat session's conversation
  // request body = { userId, sessionId }
  // returns = { success, conversation : [...<messages>] }
  getHistory: async (req, res) => {
    try {
      const { userId, sessionId } = req.body;
      const ChatModel = getChatModel(userId);
      const data = await ChatModel.findOne({ sessionId });
      res.status(200).json({
        success: true,
        conversation: data.conversation,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  },
  // Get the user's chat sessions
  // request body structure  = { userId }
  // returns = { chatList : [...{ sessionId , title }]}
  getChats: async (req, res) => {
    try {
      const { userId } = req.body;

      // Check if userId exists
      if (!userId) {
        console.error("userId is missing in the request.");
        return res.status(400).json({ error: "userId is required" });
      }

      const ChatModel = getChatModel(userId);

      // Retrieve chats with title and sessionId only
      const chats = await ChatModel.find({}, { _id: 0, title: 1, sessionId: 1 })
        .sort({ lastMessage: -1 })
        .limit(10);

      res.status(200).json({ chatList: chats });
    } catch (error) {
      console.error("Error in getChats:", error);
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  },
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
          timestamp: new Date(),
        },
      },
      $set: {
        lastMessage: new Date(),
      },
    }
  );
}

async function generate(userId, sessionId, message, newSession) {
  try {
    const response = await axios.post(llm_url, {
      prompt: message,
      new: newSession,
      userId,
      sessionId
    });

    const data = response.data;

    if (newSession) {
      const ChatModel = getChatModel(userId);
      await ChatModel.updateOne(
        { sessionId },
        {
          title: data.title,
        }
      );
    }

    await updateConvo(userId, sessionId, "bot", data.response);

    return {
      response:data.response,
      replacementParts: data.replacement_parts,
      carModel: data.car_model
    };
  } catch (error) {
    console.error("Error in LLM server", error);
    return "Oops! Something went wrong.";
  }
}

module.exports = chatController;
