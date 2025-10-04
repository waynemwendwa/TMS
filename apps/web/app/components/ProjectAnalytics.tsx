'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../../lib/config';

interface ProjectAnalytics {
  id: string;
  title: string;
  description?: string;
  status: 'TO_START' | 'ONGOING' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  totalPhases: number;
  completedPhases: number;
  inProgressPhases: number;
  plannedPhases: number;
  delayedPhases: number;
  progressPercentage: number;
  timeProgressPercentage: number;
  daysRemaining?: number;
  healthStatus: 'healthy' | 'delayed' | 'overdue' | 'urgent';
  phases: Array<{
    id: string;
    phaseName: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
    weekNumber: number;
    tasks: string[];
    materials: string[];
  }>;
}

interface ProjectAnalyticsProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function ProjectAnalytics({}: ProjectAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ProjectAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const token = localStorage.getItem('tms_token');
        if (!token) return;

        const res = await fetch(getApiUrl('/api/projects/analytics'), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          console.log('📊 Project Analytics loaded:', data.length, 'projects');
          setAnalytics(data);
        } else {
          console.error('❌ Analytics API Error:', res.status, res.statusText);
          setError(`Failed to fetch project analytics (${res.status})`);
        }
      } catch (err) {
        setError('Error fetching project analytics');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'delayed': return 'text-yellow-600 bg-yellow-100';
      case 'urgent': return 'text-orange-600 bg-orange-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'delayed': return '⚠️';
      case 'urgent': return '🚨';
      case 'overdue': return '❌';
      default: return '📊';
    }
  };

  const getProgressBarColor = (percentage: number, healthStatus: string) => {
    if (healthStatus === 'overdue') return 'bg-red-500';
    if (healthStatus === 'urgent') return 'bg-orange-500';
    if (healthStatus === 'delayed') return 'bg-yellow-500';
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">📊</span>
          Project Analytics
        </h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">📊</span>
          Project Analytics
        </h3>
        <div className="text-red-600 text-center py-4">{error}</div>
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">📊</span>
          Project Analytics
        </h3>
        <div className="text-gray-500 text-center py-4">No projects found</div>
      </div>
    );
  }

  // Calculate overall analytics
  const totalProjects = analytics.length;
  const healthyProjects = analytics.filter(p => p.healthStatus === 'healthy').length;
  const delayedProjects = analytics.filter(p => p.healthStatus === 'delayed').length;
  const urgentProjects = analytics.filter(p => p.healthStatus === 'urgent').length;
  const overdueProjects = analytics.filter(p => p.healthStatus === 'overdue').length;
  const avgProgress = totalProjects > 0 ? Math.round(analytics.reduce((sum, p) => sum + p.progressPercentage, 0) / totalProjects) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <span className="text-2xl mr-2">📊</span>
        Project Analytics
      </h3>

      {/* Overall Summary */}
      {totalProjects > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalProjects}</div>
            <div className="text-xs text-gray-600">Total Projects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{healthyProjects}</div>
            <div className="text-xs text-gray-600">Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{delayedProjects}</div>
            <div className="text-xs text-gray-600">Delayed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{urgentProjects}</div>
            <div className="text-xs text-gray-600">Urgent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{overdueProjects}</div>
            <div className="text-xs text-gray-600">Overdue</div>
          </div>
        </div>
      )}

      {/* Average Progress Bar */}
      {totalProjects > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Average Progress Across All Projects</span>
            <span className="text-sm font-bold text-gray-900">{avgProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                avgProgress >= 80 ? 'bg-green-500' : 
                avgProgress >= 50 ? 'bg-blue-500' : 
                'bg-gray-500'
              }`}
              style={{ width: `${Math.min(avgProgress, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {analytics.map((project) => (
          <div
            key={project.id}
            className="group border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/projects/${project.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') router.push(`/projects/${project.id}`);
            }}
          >
            {/* Project Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <span className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors">{project.title}</span>
                {project.description && (
                  <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>Created by: {project.createdBy.name}</span>
                  <span>•</span>
                  <span>Status: {project.status}</span>
                  {project.daysRemaining !== null && project.daysRemaining !== undefined && (
                    <>
                      <span>•</span>
                      <span className={project.daysRemaining < 0 ? 'text-red-600' : project.daysRemaining < 7 ? 'text-orange-600' : 'text-gray-600'}>
                        {project.daysRemaining < 0 
                          ? `${Math.abs(project.daysRemaining)} days overdue`
                          : `${project.daysRemaining} days remaining`
                        }
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Health Status + Hint */}
              <div className="flex flex-col items-end gap-1">
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getHealthStatusColor(project.healthStatus)}`}>
                  <span className="mr-1">{getHealthStatusIcon(project.healthStatus)}</span>
                  {project.healthStatus.charAt(0).toUpperCase() + project.healthStatus.slice(1)}
                </div>
                <div className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">View Details →</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-bold text-gray-900">{project.progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(project.progressPercentage, project.healthStatus)}`}
                  style={{ width: `${Math.min(project.progressPercentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Phase Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{project.completedPhases}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{project.inProgressPhases}</div>
                <div className="text-xs text-gray-600">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{project.plannedPhases}</div>
                <div className="text-xs text-gray-600">Planned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{project.delayedPhases}</div>
                <div className="text-xs text-gray-600">Delayed</div>
              </div>
            </div>

            {/* Project Timeline */}
            {(project.startDate || project.endDate) && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Project Timeline</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Start: {formatDate(project.startDate)}</span>
                  <span>•</span>
                  <span>End: {formatDate(project.endDate)}</span>
                </div>
              </div>
            )}

            {/* Phase Details (Collapsible) */}
            {project.phases.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  View Phase Details ({project.phases.length} phases)
                </summary>
                <div className="mt-3 space-y-2">
                  {project.phases.map((phase) => (
                    <div key={phase.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-600">#{phase.weekNumber}</span>
                        <span className="font-medium">{phase.phaseName}</span>
                        {phase.description && (
                          <span className="text-gray-500">- {phase.description}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          phase.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          phase.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          phase.status === 'DELAYED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {phase.status.replace('_', ' ')}
                        </span>
                        {(phase.startDate || phase.endDate) && (
                          <span className="text-gray-500 text-xs">
                            {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
