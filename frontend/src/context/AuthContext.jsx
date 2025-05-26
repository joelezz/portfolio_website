// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
// If AuthProvider is INSIDE your <Router>, you can use useNavigate.
// Otherwise, for logout, window.location.href is a simpler redirect.
import { useNavigate } from 'react-router-dom';

const AuthContextInternal = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null); // Initialize as null, load from localStorage in effect
    const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Start true until initial check is done
    const navigate = useNavigate(); // Make sure AuthProvider is a child of <Router>

    // Effect for initial load from localStorage and reacting to external token changes (e.g. other tabs)
    useEffect(() => {
        setIsLoadingAuth(true);
        const storedToken = localStorage.getItem('authToken');
        const storedUserJson = localStorage.getItem('authUser');

        if (storedToken) {
            setToken(storedToken); // Update state if different
            if (storedUserJson) {
                try {
                    setUser(JSON.parse(storedUserJson));
                } catch (e) {
                    localStorage.removeItem('authUser');
                    localStorage.removeItem('authToken');
                    setToken(null);
                    setUser(null);
                }
            } else {
                // Token exists but no user info in localStorage.
                // This state might indicate incomplete login or old data.
                // For now, treat as not fully authenticated or fetch user data.
                setUser(null); // Or a placeholder, or trigger user fetch
            }
        } else {
            // No token in localStorage
            setUser(null);
            setToken(null);
        }
        setIsLoadingAuth(false);
    }, []); // Run only once on initial mount to load from localStorage

    const login = useCallback(async (username, password) => {
        setIsLoadingAuth(true); // Set loading true during the login API call

        try {
            const response = await fetch('https://portfolio-website-backend-749y.onrender.com/api/admin/login', { // Ensure this path is correct
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();

            if (response.ok && data.access_token && data.user) {
                localStorage.setItem('authToken', data.access_token);
                localStorage.setItem('authUser', JSON.stringify(data.user));
                
                // CRITICAL: Set state to trigger re-render of consumers
                setToken(data.access_token);
                setUser(data.user);
                setIsLoadingAuth(false); // Finished loading

                return true; // Indicate login success
            } else {
                // Clear any potentially stored items on failed login attempt
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
                setToken(null);
                setUser(null);
                setIsLoadingAuth(false);
                throw new Error(data.message || `Login failed with status: ${response.status}`);
            }
        } catch (error) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setToken(null);
            setUser(null);
            setIsLoadingAuth(false);
            throw error; // Re-throw for the component to handle
        }
    }, []); // No dependencies means this function's definition doesn't change unless AuthProvider remounts

    const logout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setToken(null);
        setUser(null);
        setIsLoadingAuth(false); // User is no longer loading an auth state
        navigate('/'); // Navigate to login page after logout (ensure this route exists)
    }, [navigate]); // navigate is a dependency

    // Memoize the context value to prevent unnecessary re-renders of consumers
    // if AuthProvider re-renders for reasons not related to these specific values.
    const contextValue = React.useMemo(() => ({
        user,
        token,
        isLoadingAuth,
        login,
        logout,
        isAuthenticated: !!token, // Derived from the token state
    }), [user, token, isLoadingAuth, login, logout]);


    return (
        <AuthContextInternal.Provider value={contextValue}>
            {children}
        </AuthContextInternal.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContextInternal);
    if (!context) { // Check for null since createContext(null)
        throw new Error('useAuth must be used within an AuthProvider. Context is null.');
    }
    return context;
};