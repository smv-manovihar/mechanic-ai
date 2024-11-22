

import React, { useState } from 'react';
import './sidebar.css';
import { assets } from '../../assets/assets';


const Sidebar = ({ onNewChat }) => {
    const [extended, setExtended] = useState(false);
   
    return (
      <div className="sidebar">
        <div className="top">
          <img onClick={() => setExtended(prev => !prev)} className="menu" src={assets.menu_icon} alt="menu" />
          <div className="new-chat" onClick={onNewChat}>
            <img src={assets.plus_icon} alt="new chat" />
            {extended ? <p>New Chat</p> : null}
          </div>
        </div>
        {extended ? (
          <div className="recent">
            <p className="recent-title">Recent</p>
            <div className="recent-entry">
              <img src={assets.message_icon} alt="recent message" />
              <p>What is React ...</p>
            </div>
          </div>
        ) : null}
      </div>
    );
  };
  
  export default Sidebar;
  



















