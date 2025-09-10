'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getApiUrl } from '../../lib/config';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  // Enhanced project data
  mainContractor?: string;
  client?: string;
  architect?: string;
  engineer?: string;
  quantitySurveyor?: string;
  structuralEngineer?: string;
  subcontractors?: string;
  lawFirm?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    // Bio data
    mainContractor: '',
    client: '',
    architect: '',
    engineer: '',
    quantitySurveyor: '',
    structuralEngineer: '',
    subcontractors: '',
    lawFirm: '',
    // Contact information
    contractorContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    clientContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    architectContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    engineerContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    qsContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    structuralContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    subcontractorContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    lawFirmContact: { poBox: '', address: '', phone: '', location: '', email: '' }
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('getApiUrl('/api')/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('getApiUrl('/api')/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProject,
          createdBy: 'temp-user-id' // This should come from auth
        }),
      });

      if (response.ok) {
        const createdProject = await response.json();
        setProjects([createdProject, ...projects]);
        setNewProject({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          mainContractor: '',
          client: '',
          architect: '',
          engineer: '',
          quantitySurveyor: '',
          structuralEngineer: '',
          subcontractors: '',
          lawFirm: '',
          contractorContact: { poBox: '', address: '', phone: '', location: '', email: '' },
          clientContact: { poBox: '', address: '', phone: '', location: '', email: '' },
          architectContact: { poBox: '', address: '', phone: '', location: '', email: '' },
          engineerContact: { poBox: '', address: '', phone: '', location: '', email: '' },
          qsContact: { poBox: '', address: '', phone: '', location: '', email: '' },
          structuralContact: { poBox: '', address: '', phone: '', location: '', email: '' },
          subcontractorContact: { poBox: '', address: '', phone: '', location: '', email: '' },
          lawFirmContact: { poBox: '', address: '', phone: '', location: '', email: '' }
        });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PLANNING': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewProject = (projectId: string) => {
    // Navigate to project details page
    window.location.href = `/projects/${projectId}`;
  };

  const handleEditProject = (projectId: string) => {
    // Navigate to project edit page
    window.location.href = `/projects/${projectId}/edit`;
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
      const response = await fetch(`getApiUrl('/api')/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProjects(projects.filter(project => project.id !== projectId));
      } else {
        alert('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <Link href="/projects/create" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Create New Project
        </Link>
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., KISUMU COUNTY ASSEMBLY PROJECT"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Project description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={newProject.endDate}
                  onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Projects</h2>
        </div>
        {projects.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No projects found. Create your first project to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{project.title}</div>
                        {project.description && (
                          <div className="text-sm text-gray-500">{project.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.startDate && project.endDate ? (
                        <div>
                          <div>{new Date(project.startDate).toLocaleDateString()}</div>
                          <div>to {new Date(project.endDate).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        'Not set'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewProject(project.id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEditProject(project.id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
