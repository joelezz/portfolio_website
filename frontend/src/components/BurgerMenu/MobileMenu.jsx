// src/components/MobileMenu.jsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Assuming you use this for conditional links
import './MobileMenu.css'; // We'll create this CSS file

const MobileMenu = ({ isOpen, closeMenu }) => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLinkClick = () => {
    closeMenu(); // Close menu when a link is clicked
  };

  const handleLogoutClick = () => {
    logout();
    closeMenu();
  };

  return (
    <nav className={`mobile-menu ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
      <NavLink to="/" onClick={handleLinkClick} className={({isActive}) => isActive ? "active-link" : ""}>Home</NavLink>
      <NavLink to="/work" onClick={handleLinkClick} className={({isActive}) => isActive ? "active-link" : ""}>Work</NavLink>
      <NavLink to="/contact" onClick={handleLinkClick} className={({isActive}) => isActive ? "active-link" : ""}>Contact</NavLink>
      
      {isAuthenticated ? (
        <>
          {user && user.username && <span className="user-greeting">Hi, {user.username}</span>}
          <NavLink to="/dashboard" onClick={handleLinkClick} className={({isActive}) => isActive ? "active-link" : ""}>Dashboard</NavLink>
          <button onClick={handleLogoutClick} className="logout-button">Logout</button>
        </>
      ) : (
        <NavLink to="/login" onClick={handleLinkClick} className={({isActive}) => isActive ? "active-link" : ""}>Login</NavLink>
      )}
    </nav>
  );
};

export default MobileMenu;