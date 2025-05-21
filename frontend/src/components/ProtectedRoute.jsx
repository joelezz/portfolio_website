// src/components/ProtectedRoute.js
import React from 'react';
import { useAuth } from '../context/AuthContext'; // Adjust path if needed
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth(); // Assuming useAuth provides isLoading
    const location = useLocation();

    // If you have an isLoading state in AuthContext while checking token validity
    if (isLoading) {
        return <div>Loading authentication status...</div>; // Or a spinner
    }

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

export default ProtectedRoute;