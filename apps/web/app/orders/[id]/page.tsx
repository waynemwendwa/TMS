'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getApiUrl } from '../../../lib/config';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface OrderItem {
  id: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  remarks?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  title: string;
  description: string;
  status: string;
  orderDate: string;
  requiredDate?: string;
  totalAmount?: number;
  remarks?: string;
  project: {
    id: string;
    title: string;
  };
  requestedBy: {
    id: string;
    name: string;
    email: string;
  };
  procurementApprover?: {
    id: string;
    name: string;
    email: string;
  };
  chairmanApprover?: {
    id: string;
    name: string;
    email: string;
  };
  procurementSourcer?: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  procurementApprovedAt?: string;
  chairmanApprovedAt?: string;
  procurementSourcedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('tms_token');
      const response = await fetch(getApiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        router.push('/auth/login');
      } else {
        // Non-auth error: keep user state as-is and allow page to show errors
        console.error('Auth check failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Do not redirect on transient/network errors; allow refresh to recover
    }
  }, [router]);

  const fetchOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem('tms_token');
      const response = await fetch(getApiUrl(`/api/orders/${orderId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      } else if (response.status === 404) {
        setError('Order not found');
      } else if (response.status === 403) {
        setError('Access denied');
      } else {
        setError('Failed to fetch order');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to fetch order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const token = localStorage.getItem('tms_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchUserData();
    fetchOrder();
  }, [router, orderId, fetchUserData, fetchOrder]);

  const handleAction = async (action: string, data?: { approved?: boolean }) => {
    setActionLoading(action);
    try {
      const token = localStorage.getItem('tms_token');
      const response = await fetch(getApiUrl(`/api/orders/${orderId}/${action}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(updatedOrder);
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${action.replace('-', ' ')}`);
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
      setError(`Failed to ${action.replace('-', ' ')}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING_PROCUREMENT: 'bg-yellow-100 text-yellow-800',
      PENDING_CHAIRMAN: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      SOURCING: 'bg-purple-100 text-purple-800',
      SOURCED: 'bg-indigo-100 text-indigo-800',
      IN_PROGRESS: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const canApproveProcurement = () => {
    return user && ['PROCUREMENT', 'FINANCE_PROCUREMENT'].includes(user.role) && 
           order?.status === 'PENDING_PROCUREMENT';
  };

  const canApproveChairman = () => {
    return user && ['CHAIRMAN', 'CHAIRMAN_PA'].includes(user.role) && 
           order?.status === 'PENDING_CHAIRMAN';
  };

  const canSource = () => {
    return user && ['PROCUREMENT', 'FINANCE_PROCUREMENT'].includes(user.role) && 
           order?.status === 'APPROVED';
  };

  const canMarkSourced = () => {
    return user && ['PROCUREMENT', 'FINANCE_PROCUREMENT'].includes(user.role) && 
           order?.status === 'SOURCING';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
          <button
            onClick={() => router.push('/orders')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/orders')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="mt-2 text-gray-600">{order.title}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Order Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.orderNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Project</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.project.title}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Requested By</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.requestedBy.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{new Date(order.orderDate).toLocaleDateString()}</dd>
                  </div>
                  {order.requiredDate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Required Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">{new Date(order.requiredDate).toLocaleDateString()}</dd>
                    </div>
                  )}
                  {order.totalAmount && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                      <dd className="mt-1 text-sm text-gray-900">${order.totalAmount.toFixed(2)}</dd>
                    </div>
                  )}
                </dl>

                {order.description && (
                  <div className="mt-6">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.description}</dd>
                  </div>
                )}

                {order.remarks && (
                  <div className="mt-6">
                    <dt className="text-sm font-medium text-gray-500">Remarks</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.remarks}</dd>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.itemCode || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${item.totalPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Actions and Approval History */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  {canApproveProcurement() && (
                    <button
                      onClick={() => handleAction('approve-procurement')}
                      disabled={actionLoading === 'approve-procurement'}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {actionLoading === 'approve-procurement' && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      Approve for Chairman Review
                    </button>
                  )}

                  {canApproveChairman() && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleAction('approve-chairman', { approved: true })}
                        disabled={actionLoading === 'approve-chairman'}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {actionLoading === 'approve-chairman' && (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        Approve Order
                      </button>
                      <button
                        onClick={() => handleAction('approve-chairman', { approved: false })}
                        disabled={actionLoading === 'approve-chairman'}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        Reject Order
                      </button>
                    </div>
                  )}

                  {canSource() && (
                    <button
                      onClick={() => handleAction('source')}
                      disabled={actionLoading === 'source'}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {actionLoading === 'source' && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      Start Sourcing
                    </button>
                  )}

                  {canMarkSourced() && (
                    <button
                      onClick={() => handleAction('sourced')}
                      disabled={actionLoading === 'sourced'}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {actionLoading === 'sourced' && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      Mark as Sourced
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Approval History */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Approval History</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Order Created</p>
                      <p className="text-sm text-gray-500">by {order.requestedBy.name}</p>
                      <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {order.procurementApprovedAt && order.procurementApprover && (
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Procurement Approved</p>
                        <p className="text-sm text-gray-500">by {order.procurementApprover.name}</p>
                        <p className="text-xs text-gray-400">{new Date(order.procurementApprovedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {order.chairmanApprovedAt && order.chairmanApprover && (
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Chairman Approved</p>
                        <p className="text-sm text-gray-500">by {order.chairmanApprover.name}</p>
                        <p className="text-xs text-gray-400">{new Date(order.chairmanApprovedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {order.procurementSourcedAt && order.procurementSourcer && (
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Materials Sourced</p>
                        <p className="text-sm text-gray-500">by {order.procurementSourcer.name}</p>
                        <p className="text-xs text-gray-400">{new Date(order.procurementSourcedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
