import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/sidebar/sidebar';
import Main from './components/main/main';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import { account } from './appwrite'; // Import Appwrite configuration

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await account.get();
        if (user) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Not logged in or session expired', error);
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      setIsAuthenticated(false);
      alert('Logged out successfully!');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  };

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
            <Sidebar />
            <Main />
            <button onClick={handleLogout} style={logoutButtonStyle}>
              Logout
            </button>
          </>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;

const logoutButtonStyle = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  padding: '10px 20px',
  fontSize: '16px',
  backgroundColor: '#7b61ff',
  color: '#ffffff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};
