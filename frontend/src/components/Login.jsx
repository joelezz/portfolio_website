import React, { useState } from 'react';
// import axios from 'axios'; // Or use fetch

export const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Optional: for loading state

  const handleLogin = async () => {
    setError(''); // Clear previous errors
    setIsLoading(true); // Set loading state

    try {
      // Replace '/api/auth/login' with your actual backend login endpoint
      const response = await fetch('https://portfolio-website-backend-749y.onrender.com/api/admin/login', { // Or use axios.post
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      setIsLoading(false); // Reset loading state

      if (response.ok) {
        const data = await response.json();
        // Assuming the backend sends back a token and maybe user info
        // Store the token (e.g., in localStorage)
        localStorage.setItem('authToken', data.access_token); // <-- Make sure it's data.access_token
        localStorage.setItem('adminUser', JSON.stringify(data.user)); // Store user if needed        // You might want to pass user data to onLogin if needed
        onLogin(data.user, data.access_token); // Call parent function to update authentication
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid credentials or server error');
      }
    } catch (err) {
      setIsLoading(false);
      setError('Login failed. Please try again later.');
      console.error('Login error:', err);
    }
  };

  return (

  <>
      <h1>Login area</h1>
      <div className="form-container">
      <form>
        <p>Provide your credentials, please.</p>
        <label>
          <input
            className="username"
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />
        </label>
        <label>
          <input
            className="password"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </label>
        <label>
          <button className="submit-btn" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </label>
        {error && <p style={{ color: 'red' }}>{error}</p>} {/* Corrected typo here */}
      </form>
      </div>

    </>
  );
};