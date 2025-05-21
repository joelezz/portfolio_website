// src/components/ProjectCard.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // For the Edit button link

const ProjectCard = ({ project, onDelete, onEdit }) => { // Added onEdit prop
    if (!project) {
        return null;
    }

    const handleDeleteClick = (event) => {
        event.stopPropagation();
        if (onDelete) {
            onDelete(project.id);
        }
    };

    // For onEdit, you might navigate or open a modal. Here, we'll link to an edit page.
    // The actual handleEdit function would live in the parent (Work.jsx or AdminDashboard)

    return (
        <div className="project-container">

            <div className="project-link">
                 {project.project_url && (
                    <a
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
            <div className="project-card">
                {project.image_url && (
                    <img
                        src={project.image_url}
                        alt={project.name}
                        className="project-card-image"
                    />
                )}

                <h3>{project.name}</h3>
                <p className="project-text-name">
                    {project.description ? project.description : 'No description available.'}
                </p>
                  {onDelete && ( // Conditionally render Delete button
                    <button
                        onClick={handleDeleteClick}
                        className="delete-btn"
                    >
                        X
                    </button>
                )}
            </div>
               </a>
                )}
                {onEdit && ( // Conditionally render Edit button
                    <Link
                        to={`/admin/edit-project/${project.id}`} // Example route for editing
                        className="bg-yellow-500 hover:bg-yellow-700 text-white font-semibold py-2 px-3 rounded transition-colors duration-300 text-center text-xs sm:text-sm"
                    >
                        Edit
                    </Link>
                )}
              
            </div>
        </div>
    );
};

export default ProjectCard;