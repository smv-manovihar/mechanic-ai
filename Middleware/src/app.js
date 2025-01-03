const express = require('express');
const connectDB = require('./config/database');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Ensure environment variables are loaded
if (!process.env.MECHAI_CHATS_URI) {
  console.error('Error: MECHAI_CHATS_URI is not defined in .env file.');
  process.exit(1);
}

// Connect to MongoDB Chats Database
connectDB(process.env.MECHAI_CHATS_URI);

// Routes
app.use('/api', require('./routes/chatRoutes'));

// Serve static files from React frontend
const frontendBuildPath = path.join(__dirname,'..', '..', 'Frontend', 'build');
app.use(express.static(frontendBuildPath));

// Handle SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
