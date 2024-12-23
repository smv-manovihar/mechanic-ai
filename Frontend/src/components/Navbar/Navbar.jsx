import { useState, useEffect } from "react";
import "./Navbar.css";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = ({ user, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(user.email||"");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && user.email) {
      setUserEmail(user.email);
    }
  }, [user]);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleProfileInfo = () => {
    console.log("Profile Info");
    setMenuOpen(false);
  };

  return (
    <div className="nav">
      <div className="title" onClick={() => {
        if (location.pathname !== '/') {
          navigate('/');
        }
      }}>
        MechanicAI
      </div>
      <div className="user-menu">
        <div className="user-icon" onClick={toggleMenu}>
          {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
        </div>
        {menuOpen && (
          <div className="dropdown-menu">
            <button onClick={handleProfileInfo} className="dropdown-button">
              {userEmail || "Unknown User"}
            </button>
            <button
              className="dropdown-button logout-button"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
