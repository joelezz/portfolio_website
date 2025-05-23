// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BurgerIcon from './BurgerMenu/BurgerIcon';   // Assuming these paths are correct
import MobileMenu from './BurgerMenu/MobileMenu';
import { useOnClickOutside } from '../hooks/useOnClickOutside'; // Assuming this path
// You would also import your Navbar's specific CSS if you create one e.g. import './Navbar.css';

const Navbar = () => {
    const { user, logout, isLoadingAuth, isAuthenticated } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuNodeRef = useRef();
    const burgerIconRef = useRef(); // Ref for the burger icon itself

    useOnClickOutside(mobileMenuNodeRef, (event) => {
        // Check if the click originated from within the burger icon
        if (burgerIconRef.current && burgerIconRef.current.contains(event.target)) {
            return; // Don't close if clicking the burger icon
        }
        if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    });

    const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    if (isLoadingAuth) {
        return (
            <nav className="navbar loading-navbar"> {/* General navbar class */}
                <div className="navbar-container"> {/* Inner container for layout */}
                    <Link to="/" className="navbar-brand">MySite</Link>
                    <ul className="navbar-links-loading"> {/* Specific class for loading links */}
                        <li>Loading...</li>
                    </ul>
                </div>
            </nav>
        );
    }

    return (
        <div ref={mobileMenuNodeRef}> {/* Ref now wraps Navbar and MobileMenu for click outside */}
            <nav className="navbar"> {/* General navbar class */}
                <div className="navbar-container"> {/* Inner container for layout */}
                    <Link to="/" className="navbar-brand">JE</Link>

                    {/* Traditional Navbar for Desktop */}
                    <ul className="desktop-navigation"> {/* CLASS FOR DESKTOP NAV */}
                        <li><NavLink to="/" end className={({isActive}) => isActive ? "active-nav-link" : "inactive-nav-link"}>Home</NavLink></li>
                        <li><NavLink to="/work" className={({isActive}) => isActive ? "active-nav-link" : "inactive-nav-link"}>Work</NavLink></li>
                        <li><NavLink to="/contact" className={({isActive}) => isActive ? "active-nav-link" : "inactive-nav-link"}>Contact</NavLink></li>
                        { /*{!isAuthenticated ? (
                            <li><NavLink to="/dashboard" className={({isActive}) => isActive ? "active-nav-link" : "inactive-nav-link"}>Login</NavLink></li>
                        ) : (
                            <>
                                {user && user.username && <li className="nav-user-greeting">Hi, {user.username}</li>}
                                <li><NavLink to="/dashboard" className={({isActive}) => isActive ? "active-nav-link" : "inactive-nav-link"}>Dashboard</NavLink></li>
                                <li>
                                    <button onClick={logout} className="nav-logout-button">
                                        Logout
                                    </button>
                                </li>
                            </>
                        )} */}
                    </ul>

                    {/* Hamburger Menu Trigger for Mobile */}
                    <div className="mobile-navigation-trigger" ref={burgerIconRef}> {/* CLASS FOR MOBILE TRIGGER */}
                        <BurgerIcon isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} />
                    </div>
                </div>
            </nav>
            <MobileMenu isOpen={isMobileMenuOpen} closeMenu={closeMobileMenu} />
        </div>
    );
};

export default Navbar;