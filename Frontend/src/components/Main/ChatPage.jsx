import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import "./Main.css";
import Navbar from "../Navbar/Navbar";
import { assets } from "../../assets/assets";
import ChatAPI from "../../config/ChatAPI";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion"; // Import framer-motion

const botMessageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const ChatPage = ({ user, onLogout }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);
  const { sessionId } = useParams();
  const userId = user?.$id;
  const initializationRef = useRef(false);

  const handleBotResponse = useCallback(
    async (userInput) => {
      try {
        const data = await ChatAPI.addMessage(userId, sessionId, userInput);
        if (!data.success) {
          alert(data.error);
          return;
        }
        const botMessage = {
          sender: "bot",
          message: data.response,
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } catch (error) {
        console.error("Error in bot response:", error);
      }
    },
    [userId, sessionId]
  );

  useEffect(() => {
    const initializeChat = async () => {
      if (initializationRef.current) return;
      initializationRef.current = true;

      if (state?.initialMessage && state?.fromMain) {
        const initialMessage = {
          sender: "user",
          message: state.initialMessage,
        };
        setMessages([initialMessage]);
        await handleBotResponse(state.initialMessage);

        navigate(".", { replace: true, state: {} });
      } else {
        try {
          const data = await ChatAPI.getHistory(userId, sessionId);
          if (!data.success) {
            alert("Session not found");
            navigate("/");
          }
          setMessages(data.conversation || []);
        } catch (error) {
          console.error("Error fetching conversation history:", error);
        }
      }
    };

    if (userId && sessionId) {
      initializeChat();
    }
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { sender: "user", message: input };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");
      await handleBotResponse(input.trim());
    }
  };

  return (
    <div className="main">
      <Navbar user={user} onLogout={onLogout} />
      <div className="main-container">
        <div className="chat-section" ref={chatRef}>
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
              <motion.div
                className={`message ${
                  message.sender === "user" ? "user-message" : "bot-message"
                }`}
                variants={message.sender === "bot" ? botMessageVariants : {}}
                initial="hidden"
                animate="visible"
              >
                {message.sender === "bot" ? (
                  <ReactMarkdown className="bot-formatted-response">
                    {message.message}
                  </ReactMarkdown>
                ) : (
                  <p>{message.message}</p>
                )}
              </motion.div>
            </div>
          ))}
        </div>

        <div className="main-bottom">
          <div className="search-box">
            <input
              type="text"
              placeholder="Enter your message here"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <div onClick={handleSend}>
              <img src={assets.send_icon} alt="Send Icon" />
            </div>
          </div>
          <p className="bottom-info">AI may provide inaccurate info</p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
