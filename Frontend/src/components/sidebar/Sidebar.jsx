import React, { useEffect, useState, useRef } from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import axios from "axios";
import { account } from "../../config/appwrite";

const Sidebar = ({ onNewChat, onChatSelect }) => {
  const [extended, setExtended] = useState(false);
  const [chats, setChats] = useState([]); // Chat sessions
  const [selectedChat, setSelectedChat] = useState(null); // Selected chat details
  const [loading, setLoading] = useState(false); // Loading state
  const [userId, setUserId] = useState(null); // User ID
  const [offset, setOffset] = useState(0); // Offset for chat pagination
  const [hasMore, setHasMore] = useState(true); // Flag to check if more chats are available
  const [menuOpen, setMenuOpen] = useState(null); // Track open menu for each chat
  const dropdownRef = useRef(null); // Reference to dropdown

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

  // Fetch chat sessions with pagination
  const fetchChats = async (loadMore = false) => {
    if (!userId || loading || (!hasMore && loadMore)) return;

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:5000/api/chats", {
        userId,
        offset,
      });
      const { chatList, offset: newOffset } = response.data;

      if (loadMore) {
        setChats((prevChats) => [...prevChats, ...chatList]); // Append new chats
      } else {
        setChats(chatList); // Set initial chats
      }

      setOffset(newOffset); // Update offset for the next call
      setHasMore(chatList.length === 10); // If less than 10 items, no more chats
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchChats();
    }
  }, [userId]);

  const fetchChatDetails = async (chatId) => {
    try {
      setLoading(true);
      const response = await axios.post("http://localhost:5000/api/history", {
        userId,
        sessionId: chatId,
      });
      if (response.data && response.data.conversation) {
        onChatSelect(response.data.conversation); // Pass conversation to App
        setSelectedChat(chatId); // Mark as selected
      } else {
        console.error("Invalid response structure:", response.data);
      }
    } catch (error) {
      console.error("Error fetching chat details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (chatId) => {
    setMenuOpen((prev) => (prev === chatId ? null : chatId)); // Toggle menu
  };

  const handleRename = (chatId) => {
    console.log("Rename chat:", chatId);
    setMenuOpen(null); // Close the menu
  };

  // const handleDelete = (chatId) => {
  //   console.log("Delete chat:", chatId);
  //   setMenuOpen(null); // Close the menu
  // };

  const handleDelete = async (chatId) => {
    try {
      setLoading(true); // Set loading state while deleting
      // Make a POST request to the backend to delete the chat
      const response = await axios.post("http://localhost:5000/api/delete", {
        userId,
        sessionId: chatId, // Send the chatId to the backend for deletion
      });

      if (response.data.success) {
        // Successfully deleted chat, remove it from the UI
        setChats((prevChats) =>
          prevChats.filter((chat) => chat.sessionId !== chatId)
        );
        setSelectedChat(null); // Deselect the deleted chat
      } else {
        console.error("Failed to delete the chat:", response.data.error);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setMenuOpen(null); // Close the menu
      setLoading(false); // Reset loading state
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(null); // Close the menu
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
                  <p>{chat.title || "Untitled Chat"}</p>
                </div>
                <div className="menu-icon" ref={dropdownRef}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    onClick={() => handleMenuClick(chat.sessionId)}
                  >
                    {/* <circle cx="12" cy="5" r="2" fill="#bbb" />
                    <circle cx="12" cy="12" r="2" fill="#bbb" />
                    <circle cx="12" cy="19" r="2" fill="#bbb" /> */}
                    <circle cx="12" cy="5" r="2" fill="black" />
                    <circle cx="12" cy="12" r="2" fill="black" />
                    <circle cx="12" cy="19" r="2" fill="black" />
                  </svg>
                  {menuOpen === chat.sessionId && (
                    <div className="menu-dropdown">
                      <p onClick={() => handleRename(chat.sessionId)}>Rename</p>
                      <p onClick={() => handleDelete(chat.sessionId)}>Delete</p>
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
          {loading && <p>Loading more chats...</p>}
          {!hasMore && <p>No more chats available</p>}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
