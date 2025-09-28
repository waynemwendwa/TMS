'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../../lib/config';
import ApprovalRequestCard from '../../components/ApprovalRequestCard';

interface ApprovalRequest {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  totalAmount?: number;
  requestedAt: string;
  reviewedAt?: string;
  comments?: string;
  project: {
    id: string;
    title: string;
  };
  orderTemplate?: {
    id: string;
    title: string;
    items: Array<{
      item: string;
      quantity: number;
      unit: string;
      rate: number;
      amount: number;
    }>;
  };
  requestedByUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  reviewedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  approvalRequest: {
    id: string;
    title: string;
    status: string;
    project: {
      title: string;
    };
  };
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    projectId: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('tms_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Decode user from token (simplified - in production, verify the token)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
      return;
    }

    fetchApprovalRequests();
    fetchNotifications();
  }, [router]);

  const fetchApprovalRequests = async () => {
    try {
      const token = localStorage.getItem('tms_token');
      if (!token) return;

      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.projectId) queryParams.append('projectId', filters.projectId);

      const response = await fetch(getApiUrl(`/api/approvals?${queryParams.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch approval requests');
      }

      const data = await response.json();
      setApprovalRequests(data);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      setError('Failed to load approval requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('tms_token');
      if (!token) return;

      const response = await fetch(getApiUrl('/api/approvals/notifications/unread'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('tms_token');
      if (!token) return;

      await fetch(getApiUrl('/api/approvals/notifications/read-all'), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setNotifications([]);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleStatusUpdate = () => {
    fetchApprovalRequests();
    fetchNotifications();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approval requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError('');
              fetchApprovalRequests();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Approval Requests</h1>
          <p className="mt-2 text-gray-600">
            {user?.role === 'CHAIRMAN' 
              ? 'Review and approve procurement requests' 
              : 'Track your approval requests'
            }
          </p>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  {notifications.length} New Notification{notifications.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-blue-700">
                  You have {notifications.length} unread notification{notifications.length !== 1 ? 's' : ''} about approval requests.
                </p>
              </div>
              <button
                onClick={markAllNotificationsAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Mark All Read
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="UNDER_REVIEW">Under Review</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchApprovalRequests}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Approval Requests List */}
        <div className="space-y-4">
          {approvalRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No approval requests found</h3>
              <p className="text-gray-600">
                {user?.role === 'CHAIRMAN' 
                  ? 'No approval requests are currently pending your review.'
                  : 'You haven\'t created any approval requests yet.'
                }
              </p>
            </div>
          ) : (
            approvalRequests.map((request) => (
              <ApprovalRequestCard
                key={request.id}
                request={request}
                userRole={user?.role || ''}
                onStatusUpdate={handleStatusUpdate}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
