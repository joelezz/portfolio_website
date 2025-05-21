// src/services/portfolioService.js
const API_BASE_URL = 'https://portfolio-website-backend-749y.onrender.com'; // Your Flask backend URL

export const getPublicProjects = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch projects and parse error' }));
            throw new Error(errorData.message || `HTTP error ${response.status}`);
        }
        const data = await response.json();
        return data; // This should be an array of projects
    } catch (error) {
        console.error("Error fetching public projects:", error);
        throw error; // Re-throw to be handled by the component
    }
};