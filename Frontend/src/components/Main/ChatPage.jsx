import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import "./Main.css";
import Navbar from "../Navbar/Navbar";
import { assets } from "../../assets/assets";
import ChatAPI from "../../config/ChatAPI";
import { account } from "../Auth/appwrite";

const ChatPage = ( onLogout ) => {
  const { state } = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);
  const [userId, setUserId] = useState("");
  const { sessionId } = useParams();

  
  useEffect(() => {
    if (state?.userId && state?.initialMessage && state?.fromMain) {
      const initialMessage = {
        sender: "user",
        message: state.initialMessage,
      };
      setUserId(state.userId);
      setMessages([initialMessage]);
      const handleBotResponse = async (userInput) => {
        try {
          const response = await ChatAPI.addMessage(userId, sessionId);
          const botMessage = {
            sender: "bot",
            message: response.data.message,
          };
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (error) {
          console.error("Error fetching bot response:", error);
        }
      };
      handleBotResponse(state.initialMessage);
    }
  }, [userId, setUserId, state, setMessages, sessionId]);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const user = await account.get();
        setUserId(user?.$id || null);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    if(!userId)
    fetchUserId();
  }, [userId, setUserId]);


  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleBotResponse = async (userInput) => {
    try {
      const response = await ChatAPI.addMessage(userId, sessionId);
      const botMessage = {
        sender: "bot",
        message: response.data.message,
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error fetching bot response:", error);
    }
  };

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { sender: "user", message: input };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");
      handleBotResponse(input.trim());
    }
  };

 

  return (
    <div className="chat-page">
      <Navbar onLogout={onLogout}/>
      <div className="chat-container">
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
              <div
                className={`message ${
                  message.sender === "user" ? "user-message" : "bot-message"
                }`}
              >
                <p>{message.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-bottom">
          <div className="search-box">
            <input
              type="text"
              placeholder="Enter your message here"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
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
