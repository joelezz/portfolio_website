import React, { useState, useEffect } from 'react';
import { Login } from '../components/Login'; // Assuming this path is correct

const Dashboard = () => {
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for the new project form
  const [projectName, setProjectName] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [projectDescription, setProjectDescription] = useState(''); // Added description
  const [selectedFile, setSelectedFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthenticatedUser({ name: 'Admin' }); // Or decode token for actual user info
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user) => {
    setAuthenticatedUser(user || { name: 'Admin' });
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setAuthenticatedUser(null);
    // navigate('/'); // Consider redirecting
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleAddProject = async (event) => {
    event.preventDefault(); // Prevent default form submission if it were a <form>
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

const authToken = localStorage.getItem('authToken');
    if (!authToken || authToken === "[object Object]") { // Add a check for common mistake
        setFormError('Authentication token is invalid or missing. Please log in again.');
        setIsSubmitting(false);
        return;
    }

    if (!projectName || !selectedFile) {
      setFormError('Project name and image are required.');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', projectName);
    formData.append('project_url', projectUrl); // Key should match backend: project_url
    formData.append('description', projectDescription);
    formData.append('image', selectedFile); // Key should match backend: image

    try {
      const response = await fetch("https://portfolio-website-backend-749y.onrender.com/api/admin/projects", { // Corrected Endpoint
        method: "POST",
        headers: {
          // DO NOT set 'Content-Type': 'multipart/form-data' manually.
          // The browser sets it correctly with the boundary for FormData.
          'Authorization': `Bearer ${authToken}` // Add your auth token
        },
        body: formData, // Send FormData directly
      });

      setIsSubmitting(false);
      if (response.ok) {
        const result = await response.json();
        setFormSuccess(result.message || 'Project added successfully!');
        // Clear the form
        setProjectName('');
        setProjectUrl('');
        setProjectDescription('');
        setSelectedFile(null);
        // You might want to trigger a refresh of a project list here
      } else {
        const errorData = await response.json();
        setFormError(errorData.message || 'Failed to add project. Status: ' + response.status);
      }
    } catch (error) {
      setIsSubmitting(false);
      setFormError('An error occurred: ' + error.message);
      console.error("Error adding project:", error);
    }
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      {authenticatedUser ? (
        <>
          <div className="form-container">
            {formError && <p style={{ color: 'red' }}>{formError}</p>}
            {formSuccess && <p style={{ color: 'green' }}>{formSuccess}</p>}
            {/* Using a form element is good practice for accessibility and semantics */}
            <form onSubmit={handleAddProject}>
              <div>
                <label htmlFor="projectName">Project Name:</label><br />
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project name"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div style={{ marginTop: '10px' }}>
                <label htmlFor="projectUrl">Project URL (optional):</label><br />
                <input
                  id="projectUrl"
                  type="url" // Using type="url" for better semantics and potential browser validation
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isSubmitting}
                />
              </div>
              <div style={{ marginTop: '10px' }}>
                <label htmlFor="projectDescription">Description (optional):</label><br />
                <textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="A brief description of the project"
                  rows="4"
                  style={{ width: '100%' }}
                  disabled={isSubmitting}
                />
              </div>
              <div style={{ marginTop: '10px' }}>
                <label htmlFor="projectImage">Project Image (required):</label><br />
                <input
                  id="projectImage"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/gif, image/webp" // Specify accepted file types
                  required
                  disabled={isSubmitting}
                />
                {selectedFile && <p>Selected file: {selectedFile.name}</p>}
              </div>
              <button className='submit-btn' type="submit" style={{ marginTop: '20px', marginLeft: "45%" }} disabled={isSubmitting}>
                {isSubmitting ? 'Adding Project...' : 'Add'}
              </button>
            </form>
          </div>
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
};

export default Dashboard;