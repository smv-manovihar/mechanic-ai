import React, { useState, useEffect } from 'react';
import { account, ID } from './appwrite';
import './Login.css';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await account.get();
        setLoggedInUser(user);
        if (user) {
          navigate('/Chatbot');
        }
      } catch (error) {
        console.error('Not logged in', error);
      }
    };

    checkSession();

    // Listen for storage events (logout from another tab)
    const handleStorageChange = (event) => {
      if (event.key === 'logout') {
        setLoggedInUser(null);
        navigate('/');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  async function login(email, password) {
    try {
      await account.createEmailPasswordSession(email, password);
      setLoggedInUser(await account.get());
      navigate('/Chatbot');
    } catch (error) {
      console.error('Login failed:', error);
      alert(error);
    }
  }

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      localStorage.setItem('logout', Date.now());
      setLoggedInUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <h2>{loggedInUser ? `Logged in as ${loggedInUser.name}` : 'GET STARTED!!!'}</h2>

      <form>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="button" onClick={() => login(email, password)}>
          Login
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              await account.create(ID.unique(), email, password);
              login(email, password);
            } catch (error) {
              console.error('Registration failed:', error);
              alert(error);
            }
          }}
        >
          Register
        </button>

        {loggedInUser && (
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        )}
      </form>
    </div>
  );
};

export default Login;
