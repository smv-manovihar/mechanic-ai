const { getChatModel } = require('./chatSession');

const validateSession = async (req, res, next) => {
  try {
    const { userId, sessionId } = req.body;
    
    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'userId and sessionId are required' });
    }
    
    const ChatModel = getChatModel(userId);
    const session = await ChatModel.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    req.chatSession = session;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = validateSession;