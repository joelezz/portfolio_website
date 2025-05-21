// src/services/adminApiService.js
const API_ADMIN_BASE_URL = 'https://portfolio-website-backend-749y.onrender.com/api/admin'; // Or just use API_BASE_URL + '/admin'

// Helper for making authenticated requests
const adminRequest = async (endpoint, method = 'GET', body = null, token, isFormData = false) => {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData && body) { // For JSON body
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        // For DELETE, a 204 No Content is also a success, but might not have a JSON body.
        // A 200 OK with a JSON body is also common for DELETE.
        if (response.status === 204) {
            return { message: "Deleted successfully", status: 204 }; // Simulate a success body
        }

        const data = await response.json(); // Try to parse JSON for all other cases
        if (!response.ok) {
            throw new Error(data.message || `HTTP error ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error(`Admin API ${method} request to ${endpoint} failed:`, error);
        throw error;
    }
};

export const getAdminProjects = async (token) => {
    return adminRequest('/api/admin/projects', 'GET', null, token);
};

export const deleteAdminProject = async (projectId, token) => {
    return adminRequest(`/api/admin/projects/${projectId}`, 'DELETE', null, token);
};

// Add functions for createAdminProject, updateAdminProject as needed
export const createAdminProject = async (formData, token) => {
    return adminRequest('/api/admin/projects', 'POST', formData, token, true); // true for FormData
};

export const getAdminProjectById = async (projectId, token) => {
    return adminRequest(`/api/admin/projects/${projectId}`, 'GET', null, token);
};

export const updateAdminProject = async (projectId, formData, token) => {
    return adminRequest(`/api/admin/projects/${projectId}`, 'PUT', formData, token, true);
};