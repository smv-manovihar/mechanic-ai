import { useState, useEffect} from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ user, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(user.email||"");

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
      <Link to='/'style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="title">
        MechanicAI
      </div>
      </Link>
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
