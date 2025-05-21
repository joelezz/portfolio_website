// src/components/WorkSection.js
import React, { useState, useEffect } from 'react';
import { getPublicProjects } from '../services/portfolioService';
import ProjectCard from './ProjectCard';

// Basic styling for the section and grid
const sectionStyle = {
    padding: '40px 20px',
    textAlign: 'center',
    // background: '#f0f2f5' // Example background for the section
};

const gridStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '16px', // If you prefer using gap for spacing
    marginTop: '20px'
};

const WorkSection = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                setError(null);
                const fetchedProjects = await getPublicProjects();
                setProjects(fetchedProjects || []); // Ensure projects is an array
            } catch (err) {
                setError(err.message || 'Failed to load projects.');
                setProjects([]); // Clear projects on error
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []); // Empty dependency array means this runs once on mount

    if (loading) {
        return <div style={sectionStyle}><p>Loading projects...</p></div>;
    }

    if (error) {
        return <div style={sectionStyle}><p style={{ color: 'red' }}>Error: {error}</p></div>;
    }

    return (
        <section id="work" style={sectionStyle}>
            <h2>My Work</h2>
            <p>Here are some of the projects I've worked on.</p>
            {projects.length === 0 ? (
                <p>No projects to display at the moment.</p>
            ) : (
                <div style={gridStyle} className="projects-grid"> {/* Add a class for potential global styling */}
                    {projects.map(project => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default WorkSection;