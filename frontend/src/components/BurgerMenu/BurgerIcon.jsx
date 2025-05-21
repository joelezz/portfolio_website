// src/components/BurgerIcon.jsx
import React from 'react';
import './BurgerIcon.css'; // We'll create this CSS file

const BurgerIcon = ({ isOpen, toggleMenu }) => {
  return (
    <button
      className={`burger-icon ${isOpen ? 'open' : ''}`}
      onClick={toggleMenu}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      <div className="burger-bar burger-bar--1"></div>
      <div className="burger-bar burger-bar--2"></div>
      <div className="burger-bar burger-bar--3"></div>
    </button>
  );
};

export default BurgerIcon;