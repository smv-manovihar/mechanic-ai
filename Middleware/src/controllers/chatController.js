const { v4: uuidv4 } = require("uuid");
const { getChatModel } = require("../components/chatSession");
const axios = require("axios");
const llm_url = process.env.LLM;
// const llm_url = process.env.LLM_TEST;

const chatController = {
  // Creates a new session
  // Adds a new document in database with the sessionId
  // Sends the user's prompt to the LLM Server
  // Adds the LLM's response to the conversation of the session
  // request body = { userId,  message }
  // returns = { success, sessionId, error}
  createSession: async (req, res) => {
    try {
      const { userId, message } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const status = await checkServerStatus();
      if (!status.success) {
        return res.status(503).json(status);
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

      res.status(201).json({
        success: true,
        sessionId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: "Failed to create chat session",
      });
    }
  },
  // Adds the user's prompt to the already existing session in the database
  // Sends the user's prompt to the LLM Server
  // Adds the LLM's response to the conversation of the session
  // request body = { userId, sessionId, title, message }
  // returns = { success, response, urls, error }
  addMessage: async (req, res) => {
    try {
      const { userId, sessionId, message } = req.body;

      if (!userId || !sessionId || !message) {
        return res.status(400).json({ error: "Invalid message format" });
      }

      // Update conversation with user's message
      const dbRes = await updateConvo(userId, sessionId, "user", message);

      if (!dbRes) {
        console.error("Error in Database Updation");
        return res.status(500).json({
          success: false,
          response: "Oops! Something went wrong. Please try again",
          error: "Failed to save the message",
        });
      }
      // Generate LLM response (wait for the response)
      const data = await generate(userId, sessionId, message);

      if (!data.success) {
        if (!data.status) {
          return res.status(503).json(data);
        }
        return res.status(500).json(data);
      }
      const sendData = {
        success: true,
        response: data.response,
        title: data.title,
        urls: [],
        message: "Messages added successfully",
      };

      // Fetching SpareParts using API call
      if (data.replacementParts !== null){
        try {
          const response = await axios.post(`${process.env.SPARE_PARTS_API}/api/parts-list`, {
            parts: data.replacementParts,
            carModel: data.carModel,
          });
          console.log(await response.data.data)
          sendData.urls = response.data.data.map(part => {
            return part.url === null ? null : {
              name: part.name, // Assuming part has a name property
              url: `${process.env.SPARE_PARTS_API}${part.url}`
            };
          }).filter(part => part !== null); // Filter out null values
        } catch (error) {
          console.error(error);

        }
      }
      res.status(200).json(sendData);
      
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        response: "Oops! Something went wrong. Please try again",
        error: "Failed to send message",
      });
    }
  },
  // Get a chat session's conversation
  // request body = { userId, sessionId }
  // returns = { success, conversation : [{sender = ["user","bot"],message,timestamp}...] }
  getHistory: async (req, res) => {
    try {
      const { userId, sessionId } = req.body;
      if (!userId || !sessionId) {
        return res.status(400).json({
          success: false,
          error: "userId and sessionId are required",
        });
      }
      const ChatModel = getChatModel(userId);
      const data = await ChatModel.findOne({ sessionId });
      if (!data) {
        return res.stats(404).json({ error: "Chat not found" });
      }
      res.status(200).json({
        success: true,
        conversation: data.conversation,
      });
    } catch (error) {
      console.log("Error in getHistory:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch conversation",
      });
    }
  },
  // Get the user's chat sessions
  // request body structure  = { userId, offset }
  // returns = { chatList : [{ sessionId , title, offset }...]}
  getChats: async (req, res) => {
    try {
      const { userId, offset = 0 } = req.body;

      // Check if userId exists
      if (!userId) {
        console.error("userId is missing in the request.");
        return res.status(400).json({ error: "userId is required" });
      }

      const ChatModel = getChatModel(userId);

      // Convert offset and limit to integers and validate
      const offsetInt = parseInt(offset, 10);

      if (isNaN(offsetInt) || offsetInt < 0) {
        return res.status(400).json({ error: "Invalid offset value" });
      }

      // Retrieve chats with offset and limit
      const chats = await ChatModel.find({}, { _id: 0, title: 1, sessionId: 1 })
        .sort({ updatedAt: -1 })
        .skip(offsetInt)
        .limit(10);

      res.status(200).json({
        success: true,
        chatList: chats,
        offset: offsetInt + chats.length, // Return the new offset
      });
    } catch (error) {
      console.error("Error in getChats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch chats",
      });
    }
  },

  // Let's the frontend change the title of the chat
  // request body structure = { userId, sessionId, title }
  // returns = { success, title, error}
  renameTitle: async (req, res) => {
    const { userId, sessionId, title } = req.body;
    const ChatModel = getChatModel(userId);
    try {
      await ChatModel.updateOne(
        { sessionId },
        {
          $set: {
            userTitle: true,
            title: title,
          },
        }
      );
      res.status(200).json({
        success: true,
        title,
      });
    } catch (error) {
      console.log("Failed to update title" + error);
      res.status(500).json({
        success: false,
        error: "Failed to update the title",
      });
    }
  },

  // Allows deletion of chats from database
  // request body = { userId, sessionId }
  // returns = { success ,sessionId, error }
  deleteChat: async (req, res) => {
    const { userId, sessionId } = req.body;
    const ChatModel = getChatModel(userId);

    try {
      const result = await ChatModel.deleteOne({
        sessionId: sessionId,
      });
      if (result.deletedCount == 0) {
        return res.status(404).json({
          success: false,
          error: "Chat not found",
        });
      }
      res.status(200).json({
        success: true,
        sessionId,
      });
    } catch (error) {
      console.log("Error in deleteChat:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete the chat",
      });
    }
  },
};

// Helper functions
async function checkServerStatus() {
  try {
    const llm_status = await axios.get(llm_url);
    return llm_status.data;
  } catch (error) {
    console.error("LLM server not found");

    return {
      success: false,
      response:
        "I'm sorry, but I'm currently unavailable. Please try again later!",
      error: "LLM server is down.",
    };
  }
}

async function updateConvo(userId, sessionId, sender, message) {
  const ChatModel = getChatModel(userId);
  try {
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
      }
    );
    return true;
  } catch (error) {
    console.log("MongoDB error", error);
    return false;
  }
}

async function generate(userId, sessionId, message) {
  try {
    const response = await axios.post(llm_url + "/chat", {
      prompt: message,
      userId,
      sessionId,
    });

    const data = response.data;

    const ChatModel = getChatModel(userId);
    const document = await ChatModel.findOne(
      { sessionId },
      { title: 1, userTitle: 1 }
    );

    const sendData = {
      response: data.response,
      replacementParts: data.replacement_parts,
      carModel: data.car_model,
      title: document.title,
    };

    if (!document.userTitle) {
      await ChatModel.updateOne(
        { sessionId },
        {
          title: data.title,
        }
      );
      sendData.title = data.title;
    }

    const dbRes = await updateConvo(userId, sessionId, "bot", data.response);

    if (!dbRes) {
      console.error("Error in Database Updation");
      return {
        success: false,
        ...sendData,
        error: "Failed to save the message",
        status: true,
      };
    }

    return {
      success: true,
      ...sendData,
      status: true,
    };
  } catch (error) {
    if (error.response.status === 404) {
      console.error("LLM server not found");

      return {
        success: false,
        response:
          "I'm sorry, but I'm currently unavailable. Please try again later!",
        error: "LLM server is down.",
        status: false,
      };
    }

    console.error("Error in LLM server");
    return {
      success: false,
      response: "Oops! Something went wrong. Please try again",
      error: "Failed to generate response",
      status: true,
    };
  }
}

module.exports = chatController;
