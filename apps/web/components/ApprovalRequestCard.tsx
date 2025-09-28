'use client';

import { useState } from 'react';
import { getApiUrl } from '../lib/config';

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

interface ApprovalRequestCardProps {
  request: ApprovalRequest;
  userRole: string;
  onStatusUpdate: () => void;
}

export default function ApprovalRequestCard({ request, userRole, onStatusUpdate }: ApprovalRequestCardProps) {
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [comments, setComments] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('tms_token');
      if (!token) {
        throw new Error('Please log in to update approval requests');
      }

      const response = await fetch(getApiUrl(`/api/approvals/${request.id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          comments: comments.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update approval request');
      }

      onStatusUpdate();
    } catch (error) {
      console.error('Error updating approval request:', error);
      alert(error instanceof Error ? error.message : 'Failed to update approval request');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
          <p className="text-sm text-gray-600">Project: {request.project.title}</p>
          {request.description && (
            <p className="text-sm text-gray-700 mt-1">{request.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
            {request.status.replace('_', ' ')}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
            {request.priority}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
        <div>
          <span className="font-medium">Requested by:</span> {request.requestedByUser.name}
        </div>
        <div>
          <span className="font-medium">Date:</span> {formatDate(request.requestedAt)}
        </div>
        {request.totalAmount && (
          <div className="col-span-2">
            <span className="font-medium">Total Amount:</span> {formatCurrency(request.totalAmount)}
          </div>
        )}
        {request.reviewedByUser && (
          <div>
            <span className="font-medium">Reviewed by:</span> {request.reviewedByUser.name}
          </div>
        )}
        {request.reviewedAt && (
          <div>
            <span className="font-medium">Reviewed:</span> {formatDate(request.reviewedAt)}
          </div>
        )}
      </div>

      {request.comments && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
          <span className="font-medium">Comments:</span> {request.comments}
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        {userRole === 'CHAIRMAN' && request.status === 'PENDING' && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusUpdate('APPROVED')}
              disabled={loading}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Approve'}
            </button>
            <button
              onClick={() => handleStatusUpdate('REJECTED')}
              disabled={loading}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Reject'}
            </button>
            <button
              onClick={() => handleStatusUpdate('UNDER_REVIEW')}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Review'}
            </button>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Order Template Details</h4>
          {request.orderTemplate ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Template:</span> {request.orderTemplate.title}
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-1">Item</th>
                      <th className="text-left py-1">Qty</th>
                      <th className="text-left py-1">Unit</th>
                      <th className="text-left py-1">Rate</th>
                      <th className="text-left py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.orderTemplate.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-1">{item.item}</td>
                        <td className="py-1">{item.quantity}</td>
                        <td className="py-1">{item.unit}</td>
                        <td className="py-1">{formatCurrency(item.rate)}</td>
                        <td className="py-1">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No order template associated with this request.</p>
          )}
        </div>
      )}

      {userRole === 'CHAIRMAN' && request.status === 'PENDING' && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comments (optional)
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Add comments for your decision..."
          />
        </div>
      )}
    </div>
  );
}
