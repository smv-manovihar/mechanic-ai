import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // Import toast
import "./Main.css";
import Navbar from "../Navbar/Navbar";
import { assets } from "../../assets/assets";
import ChatAPI from "../../config/ChatAPI";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

const botMessageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const ChatPage = ({ user, onLogout }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatRef = useRef(null);
  const { sessionId } = useParams();
  const userId = user?.$id;
  const initializationRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholderMessages = ["Thinking...", "Diagnosing...", "Just a sec..."];

  const handleBotResponse = useCallback(
    async (userInput, placeholderId) => {
      try {
        const data = await ChatAPI.addMessage(userId, sessionId, userInput);
        if (!data.success) {
          toast.error(data.error); // Replaced alert with toast
          setLoading(false);
          return;
        }
        const botMessage = {
          sender: "bot",
          message: data.response,
          urls: data.urls, // Add urls to the bot message
        };
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === placeholderId ? botMessage : msg
          )
        );
        setLoading(false);
      } catch (error) {
        console.error("Error in bot response:", error);
        toast.error("An error occurred while fetching the bot response."); // Added toast for error
      } finally {
        setIsSending(false); // Re-enable the button after the response
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
        const placeholderId = Date.now();
        setMessages([
          initialMessage,
          { id: placeholderId, sender: "bot", message: placeholderMessages[0] },
        ]);

        setLoading(true); // Start loading to enable placeholder cycling
        await handleBotResponse(state.initialMessage, placeholderId);

        navigate(".", { replace: true, state: {} });
      } else {
        try {
          const data = await ChatAPI.getHistory(userId, sessionId);
          if (!data.success) {
            toast.error("Session not found"); // Replaced alert with toast
            navigate("/");
            return;
          }
          setMessages(data.conversation || []);
        } catch (error) {
          console.error("Error fetching conversation history:", error);
          toast.error("Failed to load chat history."); // Added toast for error
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

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setPlaceholderIndex(
          (prevIndex) => (prevIndex + 1) % placeholderMessages.length
        );
      }, 2000); // Rotate every second
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { sender: "user", message: input };
      const placeholderId = Date.now();
      setMessages((prevMessages) => [
        ...prevMessages,
        userMessage,
        { id: placeholderId, sender: "bot", message: placeholderMessages[0] },
      ]);
      setInput("");
      setLoading(true); // Disable the button while waiting for the response
      await handleBotResponse(input.trim(), placeholderId);
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
                  <>
                    <ReactMarkdown
                      className={`bot-formatted-response ${
                        loading && message.id ? "pulse-animation" : ""
                      }`}
                    >
                      {loading && message.id
                        ? placeholderMessages[placeholderIndex]
                        : message.message}
                    </ReactMarkdown>

                    {/* Display URLs if available */}
                    {message.urls && message.urls.length > 0 && (
                      <div className="urls-container">
                        {message.urls.map((urlData, idx) => (
                          <a
                            key={idx}
                            href={urlData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bot-url-link"
                          >
                            🔗 {urlData.name || `Link ${idx + 1}`}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
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
            <div
              className="send-icon"
              onClick={handleSend}
              style={{
                opacity: isSending ? 0.5 : 1,
                cursor: isSending ? "not-allowed" : "pointer",
              }}
              disabled={isSending}
            >
              <img src={assets.send_icon || ""} alt="Send Icon" />
            </div>
          </div>
          <p className="bottom-info">AI may provide inaccurate information</p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
