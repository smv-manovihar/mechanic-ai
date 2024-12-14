const express = require('express');
const connectDB = require('./config/database');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));

// Connect to MongoDB Chats Database
connectDB(process.env.MECHAI_CHATS_URI);

// Routes
app.use('/api', require('./routes/chatRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});