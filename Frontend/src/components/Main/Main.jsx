import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Main.css";
import Navbar from "../Navbar/Navbar";
import { assets } from "../../assets/assets";
import botResponses from "../../assets/botResponses.json";
import ChatAPI from "../../config/ChatAPI";

const Main = ({ user, onLogout }) => {
  const [input, setInput] = useState("");
  const [cardMessages, setCardMessages] = useState([]);
  const [isSending, setIsSending] = useState(false); // State to manage send button status
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const userId = user?.$id || "";

  // Generate random cards
  const getRandomProblemsForCards = () => {
    const keys = Object.keys(botResponses);
    const randomProblems = [];
    while (randomProblems.length < 4) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const randomProblem = botResponses[randomKey];
      if (
        randomProblem &&
        !randomProblems.some((problem) => problem.title === randomProblem.title)
      ) {
        randomProblems.push({ ...randomProblem, key: randomKey });
      }
    }
    return randomProblems;
  };

  // Send message
  const handleSend = async () => {
    if (!userId) {
      toast.error("User ID is not available");
      return;
    }

    const trimmedInput = input.trim();
    if (trimmedInput) {
      setIsSending(true); // Disable the send button
      await createNewSession(trimmedInput);
      setInput(""); // Clear input after sending
    }
  };

  // Handle card click
  const handleCardClick = async (messageKey) => {
    const selectedProblem = botResponses[messageKey];
    if (selectedProblem) {
      const userMessage = selectedProblem.title;
      setIsSending(true); // Disable the send button
      await createNewSession(userMessage);
    } else {
      toast.error(`No problem found for key: ${messageKey}`);
    }
  };

  // Create new session
  const createNewSession = async (message) => {
    try {
      const data = await ChatAPI.createSession(userId, message);
      if (!data.success) {
        toast.error(data.error);
        return;
      }
      navigate(`/chat/${data.sessionId}`, {
        state: { initialMessage: message, fromMain: true },
      });
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create a new session. Please try again later.");
    } finally {
      setIsSending(false); // Re-enable the button after the response
    }
  };

  // Initialize cards
  useEffect(() => {
    setCardMessages(getRandomProblemsForCards());
    inputRef.current?.focus(); // Focus input on component mount
  }, []);

  return (
    <div className="main">
      <Navbar user={user} onLogout={onLogout} />
      <div className="main-container">
        <div className="greet">
          <p>
            <span>Hello, {user.name}</span>
          </p>
          <p>How can I help you today?</p>
        </div>
        <div className="cards">
          {cardMessages.map((card, index) => (
            <div
              key={card.key || index}
              className="card"
              onClick={() => handleCardClick(card.key)}
            >
              <p>{card.title}</p>
              <img
                src={assets[card.icon] || ""}
                alt={`${card.title} Icon`}
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
          ))}
        </div>
        <div className="main-bottom">
          <div className="search-box">
            <input
              type="text"
              placeholder="Enter your problem here"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              ref={inputRef}
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
              <img
                src={assets.send_icon || ""}
                alt="Send Icon"
              />
            </div>
          </div>
          <p className="bottom-info">AI may provide inaccurate information</p>
        </div>
      </div>
    </div>
  );
};

export default Main;
