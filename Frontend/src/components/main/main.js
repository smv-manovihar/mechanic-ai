import React, { useState } from 'react';
import './main.css';
import { assets } from '../../assets/assets';

const Main = ({ resetChat }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isFirstMessageSent, setIsFirstMessageSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Function to handle sending the query
  const handleSend = async () => {
    if (input.trim()) {
      setIsFirstMessageSent(true);

      // Add the user message to the chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'user', text: input },
      ]);

      setLoading(true); // Indicate loading
      const query = input;
      setInput(''); // Clear input field

      try {
        const res = await fetch('https://2de4-34-74-200-198.ngrok-free.app/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }), // Send the user query
        });

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const data = await res.json();
        const botResponse = data.answer || 'No response from the server.';

        // Add the bot's response to the chat
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: botResponse },
        ]);
      } catch (error) {
        console.error('Error:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: 'Failed to fetch response. Please try again.' },
        ]);
      } finally {
        setLoading(false); // Stop loading
      }
    }
  };

  return (
    <div className="main">
      <div className="nav">
        <p>Mechanic-AI</p>
        <img src={assets.user_icon} alt="User Icon" />
      </div>
      <div className="main-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message-row ${message.sender === 'user' ? 'user-row' : 'bot-row'}`}
          >
            {message.sender === 'bot' && (
              <img src={assets.gemini_icon} alt="Bot Icon" className="message-icon" />
            )}
            <div
              className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <p>{message.text}</p>
            </div>
            {message.sender === 'user' && (
              <img src={assets.usermessage_icon} alt="User Icon" className="message-icon" />
            )}
          </div>
        ))}
      </div>
      <div className="main-bottom">
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter your query here"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <div onClick={handleSend}>
            <img src={assets.send_icon} alt="Send Icon" />
          </div>
        </div>
        {loading && <p className="loading-indicator">Loading...</p>} {/* Display while fetching */}
        <p className="bottom-info">Gemini may display inaccurate info</p>
      </div>
    </div>
  );
};

export default Main;
