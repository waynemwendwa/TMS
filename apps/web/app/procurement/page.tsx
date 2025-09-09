'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ProcurementPlan {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  projectId: string;
  items: ProcurementItem[];
}

interface ProcurementItem {
  id: string;
  itemCode: string;
  description: string;
  specification?: string;
  unit: string;
  quantity: number;
  marketPrice: number;
  tenderedPrice?: number;
  supplierId?: string;
  supplier?: Supplier;
  remarks?: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating?: number;
}

export default function ProcurementPage() {
  const [procurementPlans, setProcurementPlans] = useState<ProcurementPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('');

  useEffect(() => {
    if (selectedProject) {
      fetchProcurementPlans();
    }
  }, [selectedProject]);

  const fetchProcurementPlans = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/procurement/project/${selectedProject}`);
      if (response.ok) {
        const plans = await response.json();
        setProcurementPlans(plans);
      }
    } catch (error) {
      console.error('Error fetching procurement plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'APPROVED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading procurement plans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Procurement Plans</h1>
        <div className="flex space-x-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a project</option>
            <option value="project-1">Kisumu County Assembly Project</option>
            <option value="project-2">Nairobi Office Complex</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Create Procurement Plan
          </button>
        </div>
      </div>

      {!selectedProject ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Project</h2>
          <p className="text-gray-600">Choose a project to view its procurement plans</p>
        </div>
      ) : procurementPlans.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Procurement Plans</h2>
          <p className="text-gray-600 mb-4">This project doesn't have any procurement plans yet.</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Create First Procurement Plan
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {procurementPlans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(plan.status)}`}>
                      {plan.status}
                    </span>
                    <Link
                      href={`/procurement/${plan.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <h3 className="text-md font-medium text-gray-900 mb-3">Procurement Items</h3>
                {plan.items.length === 0 ? (
                  <p className="text-gray-500 text-sm">No items in this procurement plan</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item Code
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Market Price
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tendered Price
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Supplier
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {plan.items.slice(0, 5).map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {item.itemCode}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {item.description}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {item.unit}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              ${item.marketPrice.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {item.tenderedPrice ? `$${item.tenderedPrice.toFixed(2)}` : 'N/A'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {item.supplier?.name || 'Not assigned'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {plan.items.length > 5 && (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
                        ... and {plan.items.length - 5} more items
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
















