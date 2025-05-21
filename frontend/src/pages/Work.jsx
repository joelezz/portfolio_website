// src/pages/Work.jsx
import React, { useState, useEffect } from 'react'; // Removed unnecessary useContext here
import { getPublicProjects } from '../services/portfolioService';
import ProjectCard from '../components/ProjectCard';
import { useAuth } from '../context/AuthContext'; // CORRECTED IMPORT for the hook

const Work = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Correctly use the useAuth hook to get context values
    // If this Work.jsx is for PUBLIC projects, you might not need the token here.
    // If it's for an ADMIN view that requires a token to fetch projects, then you do.
    // Based on your previous code using getPublicProjects, token might not be used for THIS fetch.
    // However, if the delete button is added later, `token` will be needed for that.
    const { token, isAuthenticated } = useAuth(); // Get token and isAuthenticated status

    console.log('Work.jsx - isAuthenticated:', isAuthenticated, 'Token:', token); // <-- ADD THIS DEBUG LINE

    useEffect(() => {
        const fetchProjectsData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // If this is an ADMIN page needing a token to fetch projects:
                // if (!isAuthenticated) {
                //     setError("Please log in to view projects.");
                //     setLoading(false);
                //     setProjects([]);
                //     return;
                // }
                // const fetchedProjects = await getAdminProjects(token); // (Requires adminApiService.js)

                // If this is for PUBLIC projects (as per getPublicProjects):
                const fetchedProjects = await getPublicProjects();
                
                setProjects(fetchedProjects || []);
            } catch (err) {
                setError(err.message || 'Failed to load projects.');
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProjectsData();
        // Add token to dependency array if fetchProjectsData depends on it (e.g., for admin fetches)
        // For getPublicProjects, it might just be []:
    }, []); // Or [token] if using admin fetch that requires it

    // ... rest of your Work.jsx component (handleDeleteProject, return JSX) ...
    // Remember the handleDeleteProject function will need the token if this is an admin page:
    const handleDeleteProject = async (projectId) => {
        
        console.log("Attempting to delete. isAuthenticated:", isAuthenticated, "Token being used:", token);

        if (!isAuthenticated || !token) { // Check authentication before delete
            alert("You must be logged in to delete projects.");
            setError("Authentication required.");
            return;
        }
        if (!window.confirm('Are you sure you want to delete this project?')) return;

        try {
            const response = await fetch(`http://localhost:5000/api/admin/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                // const result = await response.json(); // DELETE might return 204 or JSON
                // alert(result.message || 'Project deleted successfully!');
                alert('Project deleted successfully!');
                setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Failed to delete project' }));
                throw new Error(errorData.message);
            }
        } catch (err) {
            console.error("Error deleting project:", err);
            alert(`Error deleting project: ${err.message}`);
            setError(err.message);
        }
    };
    
    // Your existing return JSX... making sure to pass onDelete to ProjectCard if this is admin view
    return (
        <section id="work" className="py-10 px-4 bg-gray-50 dark:bg-gray-900">
                <h1>
                    My Work {/* Or "Manage Projects" if admin */}
                </h1>
                {/* ... loading/error states ... */}
                { isAuthenticated && /* Conditionally show add project link if admin and logged in */
                  <div>
                    <button href="/dashboard" className="primary-btn">Add</button>
                  </div>
                }
                {projects.length > 0 && !loading && !error ? (
                    <div className="projects-grid flex flex-wrap justify-center gap-6">
                        {projects.map(project => (
                            <ProjectCard 
                                key={project.id} 
                                project={project} 
                                // Only pass onDelete if this is an admin view and user is authenticated
                                onDelete={isAuthenticated ? handleDeleteProject : null} 
                            />
                        ))}
                    </div>
                ) : (
                     !loading && <p className="text-center text-gray-500 dark:text-gray-400">No projects to display.</p>
                )}
        </section>
    );
};

export default Work;