const express = require('express');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();
app.use(express.json());

// Connect to MongoDB Chats Database
connectDB(process.env.MECHAI_CHATS_URI);

// Routes
app.use('/api', require('./routes/chatRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});