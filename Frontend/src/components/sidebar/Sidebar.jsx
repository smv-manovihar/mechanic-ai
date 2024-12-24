import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import ChatAPI from "../../config/ChatAPI";
import ConfirmToast from "./ConfirmToast";

const Sidebar = ({ user, onChatSelect }) => {
  const [extended, setExtended] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingTitle, setEditingTitle] = useState(null);
  const [newTitle, setNewTitle] = useState("");


  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const userId = user.$id || "";
  const navigate = useNavigate();
  const { sessionId } = useParams();

  // Click outside handler effect
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close menu dropdown if clicked outside
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(null);
      }
      
      // Close rename input if clicked outside
      if (
        editingTitle &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setEditingTitle(null);
        setNewTitle("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingTitle]);

  const fetchChats = useCallback(
    async (loadMore = false) => {
      if (!userId || loading || (!hasMore && loadMore)) return;
      setLoading(true);
      const data = await ChatAPI.getChats(userId, offset);
      if (!data.success) {
        toast.error("Failed to load chats.");
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

  const handleMenuClick = (e, chatId) => {
    e.stopPropagation();
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
        toast.error(data.error || "Failed to rename chat.");
      } else {
        toast.success("Chat renamed successfully.");
      }
      setEditingTitle(null);
      setNewTitle("");
      setMenuOpen(null);
    }
  };

  const handleDelete = async (chatId) => {
    toast(
      <ConfirmToast
        message="Are you sure you want to delete this chat?"
        onConfirm={async () => {
          try {
            const data = await ChatAPI.deleteChat(userId, chatId);
            if (data.success) {
              toast.success("Chat deleted successfully.");
              setChats((prevChats) =>
                prevChats.filter((chat) => chat.sessionId !== chatId)
              );
              if (selectedChat === chatId) {
                setSelectedChat(null);
                onChatSelect(null);
              }
              navigate("/");
            } else {
              toast.error(data.error || "Failed to delete chat.");
            }
          } catch (error) {
            toast.error("An error occurred while deleting the chat.");
          }
        }}
      />,
      { autoClose: false }
    );
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
                      ref={inputRef}
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleRename(chat.sessionId);
                      }}
                      autoFocus
                    />
                  ) : (
                    <p>{chat.title || "New Chat"}</p>
                  )}
                </div>
                <div className="menu-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    onClick={(e) => handleMenuClick(e, chat.sessionId)}
                  >
                    <circle cx="12" cy="5" r="2" fill="white" />
                    <circle cx="12" cy="12" r="2" fill="white" />
                    <circle cx="12" cy="19" r="2" fill="white" />
                  </svg>
                  {menuOpen === chat.sessionId && (
                    <div
                      className="menu-dropdown"
                      ref={menuRef}
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