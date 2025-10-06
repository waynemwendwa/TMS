'use client';

import { useState, useEffect, useMemo } from 'react';
import { getApiUrl } from '../../lib/config';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'TO_START':
        return {
          text: 'To Start',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: ClockIcon,
          dotColor: 'bg-amber-400'
        };
      case 'ONGOING':
        return {
          text: 'Ongoing',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: PlayIcon,
          dotColor: 'bg-blue-400'
        };
      case 'COMPLETED':
        return {
          text: 'Completed',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircleIcon,
          dotColor: 'bg-emerald-400'
        };
      default:
        return {
          text: status,
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: ExclamationTriangleIcon,
          dotColor: 'bg-gray-400'
        };
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white rounded-xl shadow-lg">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Projects
              </h1>
              <p className="mt-2 text-gray-600 text-lg">Manage your construction projects with precision</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <PlusIcon className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
            Create New Project
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-red-700 font-medium">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Overview Stats and Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
                  <p className="text-3xl font-bold text-gray-900">{total}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">To Start</p>
                  <p className="text-3xl font-bold text-amber-600">{toStart}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl">
                  <ClockIcon className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Ongoing</p>
                  <p className="text-3xl font-bold text-blue-600">{ongoing}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <PlayIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600">{completed}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <FunnelIcon className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-sm font-semibold text-gray-900">Filter by Status</h3>
              </div>
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={statusFilter}
                onChange={(e)=> setStatusFilter(e.target.value as 'ALL'|'TO_START'|'ONGOING'|'COMPLETED')}
              >
                <option value="ALL">All Projects</option>
                <option value="TO_START">To Start</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-sm font-semibold text-gray-900">Search Projects</h3>
              </div>
              <div className="relative">
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-10 text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Search by title or description..."
                  value={search}
                  onChange={(e)=> setSearch(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Create Project Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <PlusIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="w-full text-gray-900 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                    placeholder="Enter project title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Duration (weeks)
                  </label>
                  <input
                    type="number"
                    value={newProject.estimatedDuration}
                    onChange={(e) => setNewProject({ ...newProject, estimatedDuration: parseInt(e.target.value) || 0 })}
                    className="w-full text-gray-900 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                    placeholder="Enter estimated duration in weeks"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full text-gray-900 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                  rows={4}
                  placeholder="Enter project description"
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 text-gray-600 font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-6">Create your first project to get started with project management</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {visibleProjects.map((project) => {
              const statusConfig = getStatusConfig(project.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={project.id} className="group bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                  {/* Header with gradient */}
                  <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                  
                  <div className="p-6">
                    {/* Project Title and Status */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                        {project.title}
                      </h3>
                      <div className="flex flex-col items-end space-y-2">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                          <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor} mr-2`}></div>
                          {statusConfig.text}
                        </div>
                        <select
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    
                    {/* Description */}
                    {project.description && (
                      <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                        {project.description}
                      </p>
                    )}

                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <UserGroupIcon className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{project.stakeholders.length}</span>
                        <span>Stakeholders</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <DocumentTextIcon className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{project._count.documents}</span>
                        <span>Documents</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <ChartBarIcon className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{project._count.projectPhases}</span>
                        <span>Phases</span>
                      </div>
                      {project.estimatedDuration && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <ClockIcon className="h-4 w-4 text-amber-500" />
                          <span className="font-medium">{project.estimatedDuration}</span>
                          <span>weeks</span>
                        </div>
                      )}
                    </div>

                    {/* Created by */}
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-600">
                          {project.createdByUser.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span>Created by <span className="font-medium text-gray-700">{project.createdByUser.name}</span></span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 disabled:opacity-60 transition-colors duration-200"
                        disabled={deletingProjectId === project.id}
                      >
                        {deletingProjectId === project.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-300 border-t-red-600 mr-2"></div>
                            Deleting...
                          </div>
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
