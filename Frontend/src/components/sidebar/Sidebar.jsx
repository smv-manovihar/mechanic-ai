import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import axios from "axios";
import ChatAPI from "../../config/ChatAPI";

const Sidebar = ({ user, onNewChat, onChatSelect }) => {
  const [extended, setExtended] = useState(false);
  const [chats, setChats] = useState([]); // Chat sessions
  const [selectedChat, setSelectedChat] = useState(null); // Selected chat details
  const [loading, setLoading] = useState(false); // Loading state
  const [userId, setUserId] = useState(null); // User ID
  const [offset, setOffset] = useState(0); // Offset for chat pagination
  const [hasMore, setHasMore] = useState(true); // Flag to check if more chats are available
  const [menuOpen, setMenuOpen] = useState(null); // Track open menu for each chat
  const dropdownRef = useRef(null); // Reference to dropdown
  const [editingTitle, setEditingTitle] = useState(null); // Track which chat is being renamed
  const [newTitle, setNewTitle] = useState(""); // Store the new title input

  const navigate = useNavigate();

  useEffect(() => {
    setUserId(user.$id);
  }, [user]);

  // Fetch chat sessions with pagination
  const fetchChats = useCallback(
    async (loadMore = false) => {
      if (!userId || loading || (!hasMore && loadMore)) return;
      setLoading(true);
      const data = await ChatAPI.getChats(userId, offset);
      if (!data.success) {
        setLoading(false);
        return;
      }
      const { chatList, offset: newOffset } = data;

      if (loadMore) {
        setChats((prevChats) => [...prevChats, ...chatList]); // Append new chats
      } else {
        setChats(chatList); // Set initial chats
      }

      setOffset(newOffset); // Update offset for the next call
      setHasMore(chatList.length === 10); // If less than 10 items, no more
      setLoading(false);
    },
    [userId, loading, offset, hasMore]
  );

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchChats();
    }
  }, [userId, fetchChats]);

  const fetchChatDetails = async (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  const handleMenuClick = (chatId) => {
    setMenuOpen((prev) => (prev === chatId ? null : chatId));
  };

  const handleRename = async (chatId) => {
    if (newTitle.trim()) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.sessionId === chatId ? { ...chat, title: newTitle } : chat
        )
      );
      const data = ChatAPI.renameTitle(userId, chatId, newTitle);
      if (!data.success) {
        alert(data.error);
      }
      setEditingTitle(null); // Close the rename input field
      setNewTitle(""); // Clear the input
      setMenuOpen(null); // Close the dropdown menu after renaming
    }
  };

  const handleDelete = async (chatId) => {
    try {
      const response = await axios.post("http://localhost:5000/api/delete", {
        userId: userId,
        sessionId: chatId,
      });

      // Handle 204 status separately
      if (response.status === 204) {
        console.log("Chat deleted successfully!");

        // Update the chats in the UI
        setChats((prevChats) =>
          prevChats.filter((chat) => chat.sessionId !== chatId)
        );

        // Deselect the chat if it was selected
        if (selectedChat === chatId) {
          setSelectedChat(null);
          onChatSelect(null);
        }

        // Close the dropdown menu
        setMenuOpen(null);

        return; // Exit function after successful deletion
      }

      // For other statuses, check the response data
      if (response?.data?.success) {
        console.log("Chat deleted successfully!");
        setChats((prevChats) =>
          prevChats.filter((chat) => chat.sessionId !== chatId)
        );
        if (selectedChat === chatId) {
          setSelectedChat(null);
          onChatSelect(null);
        }
        setMenuOpen(null);
      } else {
        console.error(
          "Error deleting chat:",
          response?.data?.error || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error deleting chat:", error.message);
      console.error("Full error object:", error.response?.data || error);
    }
  };

  return (
    <div className="sidebar">
      <div className="top">
        <img
          onClick={() => setExtended((prev) => !prev)}
          className="menu"
          src={assets.menu_icon}
          alt="menu"
        />
        <div className="new-chat" onClick={onNewChat}>
          <img src={assets.plus_icon} alt="new chat" />
          {extended ? <p>New Chat</p> : null}
        </div>
      </div>

      {extended && (
        <div className="recent">
          <p className="recent-title">Recent</p>
          <div className="recent-list">
            {chats.map((chat) => (
              <div key={chat.sessionId} className="recent-entry">
                <div
                  className={`chat-content ${
                    selectedChat === chat.sessionId ? "selected" : ""
                  }`}
                  onClick={() => fetchChatDetails(chat.sessionId)}
                >
                  {editingTitle === chat.sessionId ? (
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={() => setEditingTitle(null)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleRename(chat.sessionId);
                      }}
                      autoFocus
                    />
                  ) : (
                    <p>{chat.title || "New Chat"}</p>
                  )}
                </div>
                <div className="menu-icon" ref={dropdownRef}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent immediate closing
                      handleMenuClick(chat.sessionId);
                    }}
                  >
                    <circle cx="12" cy="5" r="2" fill="black" />
                    <circle cx="12" cy="12" r="2" fill="black" />
                    <circle cx="12" cy="19" r="2" fill="black" />
                  </svg>
                  {menuOpen === chat.sessionId && (
                    <div
                      className="menu-dropdown"
                      onClick={(e) => e.stopPropagation()} // Prevent outside click handler
                    >
                      <button onClick={() => setEditingTitle(chat.sessionId)}>
                        Rename
                      </button>
                      <button onClick={() => handleDelete(chat.sessionId)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {hasMore && !loading && (
            <button className="load-more" onClick={() => fetchChats(true)}>
              Load More
            </button>
          )}
          {!hasMore && <p>No more chats available</p>}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
