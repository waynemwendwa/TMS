'use client';

import { useState, useEffect, useMemo } from 'react';
import { getApiUrl } from '../../lib/config';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'TO_START' | 'ONGOING' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
  estimatedDuration?: number;
  createdAt: string;
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
  stakeholders: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    role: string;
  }[];
  _count: {
    documents: number;
    procurementItems: number;
    projectPhases: number;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL'|'TO_START'|'ONGOING'|'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');
  const [updatingProjectId, setUpdatingProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    estimatedDuration: 0
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('tms_token');
      if (!token) return;

      const res = await fetch(getApiUrl('/api/projects'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('tms_token');
      if (!token) return;

      const res = await fetch(getApiUrl('/api/projects'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProject)
      });

      if (!res.ok) {
        throw new Error('Failed to create project');
      }

      const project = await res.json();
      setProjects([project, ...projects]);
      setNewProject({ title: '', description: '', estimatedDuration: 0 });
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TO_START':
        return 'bg-yellow-100 text-yellow-800';
      case 'ONGOING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'TO_START':
        return 'To Start';
      case 'ONGOING':
        return 'Ongoing';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  const { total, toStart, ongoing, completed } = useMemo(() => {
    const toStartCount = projects.filter(p => p.status === 'TO_START').length;
    const ongoingCount = projects.filter(p => p.status === 'ONGOING').length;
    const completedCount = projects.filter(p => p.status === 'COMPLETED').length;
    return { total: projects.length, toStart: toStartCount, ongoing: ongoingCount, completed: completedCount };
  }, [projects]);

  const visibleProjects = useMemo(() => {
    const byStatus = projects.filter(p => statusFilter === 'ALL' ? true : p.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }, [projects, statusFilter, search]);

  const updateProjectStatus = async (id: string, status: 'TO_START'|'ONGOING'|'COMPLETED') => {
    const token = localStorage.getItem('tms_token');
    if (!token) return;
    try {
      setUpdatingProjectId(id);
      const res = await fetch(getApiUrl(`/api/projects/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setProjects(prev => prev.map(p => p.id === id ? { ...p, status: updated.status } : p));
      }
    } finally {
      setUpdatingProjectId(null);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
    const token = localStorage.getItem('tms_token');
    if (!token) return;
    try {
      setDeletingProjectId(id);
      const res = await fetch(getApiUrl(`/api/projects/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
      }
    } finally {
      setDeletingProjectId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="mt-2 text-gray-600">Manage your construction projects</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Project
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Overview Stats and Controls */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Projects</div>
            <div className="text-2xl font-bold text-gray-900">{total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">To Start</div>
            <div className="text-2xl font-bold text-yellow-600">{toStart}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Ongoing</div>
            <div className="text-2xl font-bold text-blue-600">{ongoing}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-green-600">{completed}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 md:col-span-2">
            <div className="text-sm text-gray-600 mb-1">Filter by status</div>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
              value={statusFilter}
              onChange={(e)=> setStatusFilter(e.target.value as 'ALL'|'TO_START'|'ONGOING'|'COMPLETED')}
            >
              <option value="ALL">All</option>
              <option value="TO_START">To Start</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div className="bg-white rounded-lg shadow p-4 md:col-span-2">
            <div className="text-sm text-gray-600 mb-1">Search</div>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
              placeholder="Search by title or description"
              value={search}
              onChange={(e)=> setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Create Project Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter project description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Estimated Duration (weeks)
                </label>
                <input
                  type="number"
                  value={newProject.estimatedDuration}
                  onChange={(e) => setNewProject({ ...newProject, estimatedDuration: parseInt(e.target.value) || 0 })}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter estimated duration in weeks"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No projects found</div>
            <p className="text-gray-400">Create your first project to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                    <select
                      className="border border-gray-300 rounded px-2 py-1 text-xs"
                      defaultValue={project.status}
                      onChange={(e)=> updateProjectStatus(project.id, e.target.value as 'TO_START'|'ONGOING'|'COMPLETED')}
                      disabled={updatingProjectId === project.id}
                    >
                      <option value="TO_START">To Start</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>
                
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div>Created by: {project.createdByUser.name}</div>
                  <div>Stakeholders: {project.stakeholders.length}</div>
                  <div>Documents: {project._count.documents}</div>
                  <div>Phases: {project._count.projectPhases}</div>
                  {project.estimatedDuration && (
                    <div>Duration: {project.estimatedDuration} weeks</div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 disabled:opacity-60"
                    disabled={deletingProjectId === project.id}
                  >
                    {deletingProjectId === project.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
