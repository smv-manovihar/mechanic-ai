import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import ChatAPI from "../../config/ChatAPI";

const Sidebar = ({ user, onChatSelect }) => {
  const [extended, setExtended] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  const dropdownRef = useRef(null);
  const [editingTitle, setEditingTitle] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  const userId = user.$id || "";
  const navigate = useNavigate();
  const { sessionId } = useParams();

// Experimental code tried to change the title and add a entry dynamically
  // const addRecentEntry = (newChat) => {
  //   setChats((prevChats) => [newChat,...prevChats]);
  // };

  // const updateChatTitle = (sessionId, newTitle) => {
  //   setChats((prevChats) => {
  //     const chatIndex = prevChats.findIndex((chat) => chat.sessionId === sessionId);
  
  //     if (chatIndex === -1) {
  //       return prevChats; // If no matching sessionId, return unchanged array
  //     }
  
  //     if (prevChats[chatIndex].title === newTitle) {
  //       return prevChats; // If titles are the same, return unchanged array
  //     }
  
  //     // Create a new array with the updated title for the specific chat
  //     const updatedChats = [...prevChats];
  //     updatedChats[chatIndex] = {
  //       ...updatedChats[chatIndex],
  //       title: newTitle,
  //     };
  
  //     return updatedChats;
  //   });
  // };
  
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
        setChats((prevChats) => [...prevChats, ...chatList]);
      } else {
        setChats(chatList);
      }

      setOffset(newOffset);
      setHasMore(chatList.length === 10);
      setLoading(false);
    },
    [userId, loading, offset, hasMore]
  );

  useEffect(() => {
    if (userId) {
      fetchChats();
    }
  }, [userId]);

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
      const data = await ChatAPI.renameTitle(userId, chatId, newTitle);
      if (!data.success) {
        alert(data.error);
      }
      setEditingTitle(null);
      setNewTitle("");
      setMenuOpen(null);
    }
  };

  const handleDelete = async (chatId) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this chat?"
    );
    if (confirm) {
      try {
        const data = await ChatAPI.deleteChat(userId, chatId);
        if (data.success) {
          // Update the chats in the UI
          alert("Chat deleted successfully");
          setChats((prevChats) =>
            prevChats.filter((chat) => chat.sessionId !== chatId)
          );
          setOffset((prev)=> prev-1);
          // Deselect the chat if it was selected
          if (selectedChat === chatId) {
            setSelectedChat(null);
            onChatSelect(null);
          }
          navigate('/');

          setMenuOpen(null);

          return; // Exit function after successful deletion
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error("Error deleting chat:", error.message);
        console.error("Full error object:", error.response?.data || error);
      }
    }
  };

  return (
    <div className={`sidebar ${extended ? "extended" : ""}`}>
      <div className="top">
        <img
          onClick={() => setExtended((prev) => !prev)}
          className="menu"
          src={assets.menu_icon}
          alt="menu"
        />
        <div className="new-chat" onClick={() => navigate("/")}>
          <img src={assets.plus_icon} alt="new chat" />
          {extended && <p>New Chat</p>}
        </div>
      </div>

      {extended && (
        <div className="recent">
          <p className="recent-title">Recent</p>
          <div className="recent-list">
            {chats.map((chat) => (
              <div
                key={chat.sessionId}
                className={`recent-entry ${
                  sessionId === chat.sessionId ? "active" : ""
                }`}
                onClick={() => fetchChatDetails(chat.sessionId)}
              >
                <div
                  className={`chat-content ${
                    selectedChat === chat.sessionId ? "selected" : ""
                  }`}
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
                      e.stopPropagation();
                      handleMenuClick(chat.sessionId);
                    }}
                  >
                    <circle cx="12" cy="5" r="2" fill="white" />
                    <circle cx="12" cy="12" r="2" fill="white" />
                    <circle cx="12" cy="19" r="2" fill="white" />
                  </svg>
                  {menuOpen === chat.sessionId && (
                    <div
                      className="menu-dropdown"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingTitle(chat.sessionId);
                          setNewTitle(chat.title);
                          setMenuOpen(null);
                        }}
                      >
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
        </div>
      )}
    </div>
  );
};

export default Sidebar;
