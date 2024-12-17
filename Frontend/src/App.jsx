import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation} from "react-router-dom";
import Sidebar from "./components/Sidebar/Sidebar";
import Main from "./components/Main/Main";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import { account } from "./components/Auth/appwrite";
import "./App.css";
import Loading from "./components/Auth/Loading";
import ChatPage from "./components/Main/ChatPage";
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location =  useLocation()
  useEffect(() => {
    const checkSession = async () => {
      if (!user) {
        try {
          const user = await account.get();
          if (user) {
            setUser(user);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error("Not logged in or session expired", error);
        } finally {
          setLoading(false);
        }
      }
    };

    checkSession();
  }, [user, setUser]);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      setIsAuthenticated(false);
      alert("Logged out successfully!");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Loading />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="/login"
          element={<Login onLogin={() => setIsAuthenticated(true)} />}
        />
        <Route
          path="/signup"
          element={<Signup onSignup={() => setIsAuthenticated(true)} />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <Sidebar user={user}/>
            <Main user={user} onLogout={handleLogout} />
          </>
        }
      />
      <Route
        path="/chat/:sessionId"
        element={
          <>
            <Sidebar user={user}/>
            <ChatPage user={user} onLogout={handleLogout} key={location.pathname} />
          </>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
