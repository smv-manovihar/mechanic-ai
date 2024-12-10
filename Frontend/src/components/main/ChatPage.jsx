import React, { useState, useEffect, useRef } from "react";
import "./Main.css";
import { assets } from "../../assets/assets";
import botResponses from "../../assets/botResponses.json";
// import axios from "axios";
import { account } from "../../config/appwrite"; // Import the account object from
import { API_URL } from "../../config/API";

const ChatPage = ({ resetChat, onLogout, previousConversation }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isFirstMessageSent, setIsFirstMessageSent] = useState(false);
  const [cardMessages, setCardMessages] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [userId, setUserId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Only update messages if there is a previous conversation
    if (previousConversation && previousConversation.length > 0) {
      setMessages(previousConversation);
      setIsFirstMessageSent(true); // Indicate that the chat has started
    }
  }, [previousConversation]);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const user = await account.get(); // Fetch the logged-in user from Appwrite
        setUserId(user?.$id || null); // Save the userId
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUserId();
  }, []);

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  const getRandomProblemsForCards = () => {
    const keys = Object.keys(botResponses);
    const randomProblems = [];
    while (randomProblems.length < 4) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const randomProblem = botResponses[randomKey];
      if (
        !randomProblems.some((problem) => problem.title === randomProblem.title)
      ) {
        randomProblems.push({ ...randomProblem, key: randomKey });
      }
    }
    return randomProblems;
  };

  const handleSend = async () => {
    if (!userId) {
      console.error("User ID is not available");
      return;
    }

    if (input.trim()) {
      setIsFirstMessageSent(true);
      const newMessage = { sender: "user", text: input };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInput("");
      inputRef.current?.focus();

      try {
        let response;
        if (!sessionId) {
          // Create a new session for the first message
          response = await axios.post(`${API_URL}/api/new`, {
            userId,
            message: input,
          });
          console.log("New session created with ID:", response.data.sessionId);
          setSessionId(response.data.sessionId); // Save the session ID
        } else {
          // Use the existing session ID for subsequent messages
          response = await axios.post(`${API_URL}/api/message`, {
            userId,
            sessionId,
            message: input,
          });
        }

        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: response.data.response },
        ]);
      } catch (error) {
        console.error("Error in sending message:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "bot",
            text: "Oops! Something went wrong. Please try again.",
          },
        ]);
      }
    }
  };

  const handleCardClick = async (messageKey) => {
    const selectedProblem = botResponses[messageKey];
    const userMessage = selectedProblem.title;

    setIsFirstMessageSent(true);
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "user", text: userMessage },
    ]);

    try {
      let response;
      if (!sessionId) {
        // Create a new session when clicking a card
        response = await axios.post(`${API_URL}/api/new`, {
          userId,
          message: userMessage,
        });
        console.log("New session created with ID:", response.data.sessionId);
        setSessionId(response.data.sessionId);
      } else {
        response = await axios.post(`${API_URL}/api/message`, {
          userId,
          sessionId,
          message: userMessage,
        });
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: response.data.response },
      ]);
    } catch (error) {
      console.error("Error in creating chat from card:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: "An error occurred. Please try again." },
      ]);
    }
  };

  const startNewChat = () => {
    setSessionId(null); // Reset session ID for a new conversation
    setMessages([]);
    setIsFirstMessageSent(false);
  };

  useEffect(() => {
    setCardMessages(getRandomProblemsForCards());
    startNewChat();
  }, [resetChat]);

  return (
    <div className="main">
      <div className="nav">
        <p>Mechanic-AI</p>
        <div className="user-section" onClick={toggleDropdown}>
          <img src={assets.user_icon} alt="User Icon" />
          {isDropdownOpen && (
            <div className="dropdown">
              <button onClick={onLogout} className="dropdown-item">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="main-container">
        {!isFirstMessageSent ? (
          <>
            <div className="greet">
              <p>
                <span>Hello, Dev</span>
              </p>
              <p>How can I help you today?</p>
            </div>
            <div className="cards">
              {cardMessages.map((card, index) => (
                <div
                  key={index}
                  className="card"
                  onClick={() => handleCardClick(card.key)}
                >
                  <p>{card.title}</p>
                  <img src={assets[card.icon]} alt={`${card.title} Icon`} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="chat-section">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message-row ${
                  message.sender === "user" ? "user-row" : "bot-row"
                }`}
              >
                {message.sender === "bot" && (
                  <img
                    src={assets.gemini_icon}
                    alt="Bot Icon"
                    className="message-icon"
                  />
                )}
                <div
                  className={`message ${
                    message.sender === "user" ? "user-message" : "bot-message"
                  }`}
                >
                  <p>{message.message || message.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="main-bottom">
          <div className="search-box">
            <input
              type="text"
              placeholder="Enter a prompt here"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              ref={inputRef}
            />
            <div onClick={handleSend}>
              <img src={assets.send_icon} alt="Send Icon" />
            </div>
          </div>
          <p className="bottom-info">This may display inaccurate info</p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
