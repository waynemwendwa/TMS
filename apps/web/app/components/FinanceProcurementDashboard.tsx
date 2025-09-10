import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getApiUrl } from '../../lib/config';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface FinanceProcurementDashboardProps {
  user: User;
}

export default function FinanceProcurementDashboard({ user }: FinanceProcurementDashboardProps) {
  const [stats, setStats] = useState({
    activeSuppliers: 0,
    procurementPlans: 0,
    pendingQuotes: 0,
    totalBudget: 0
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
    async function fetchStats() {
      if (!token) return;
      try {
        const res = await fetch('getApiUrl('/api')/dashboard/finance-procurement', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching finance-procurement dashboard stats:', error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}</h1>
        <p className="text-purple-100">Finance & Procurement Dashboard - Supplier & Procurement Management</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-blue-600">{stats.activeSuppliers}</div>
          <div className="text-sm text-gray-600">Active Suppliers</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-green-600">{stats.procurementPlans}</div>
          <div className="text-sm text-gray-600">Procurement Plans</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-orange-600">{stats.pendingQuotes}</div>
          <div className="text-sm text-gray-600">Pending Quotes</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-purple-600">KES {stats.totalBudget.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Budget</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/suppliers" className="bg-blue-600 text-white text-center px-4 py-3 rounded-md hover:bg-blue-700 transition-colors">
            Manage Suppliers
          </Link>
          <Link href="/procurement" className="bg-green-600 text-white text-center px-4 py-3 rounded-md hover:bg-green-700 transition-colors">
            Procurement Plans
          </Link>
          <Link href="/reports" className="bg-purple-600 text-white text-center px-4 py-3 rounded-md hover:bg-purple-700 transition-colors">
            Financial Reports
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Suppliers</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">ABC Construction Ltd</div>
                <div className="text-sm text-gray-500">Cables, LV Boards, Fittings</div>
              </div>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">Tech Solutions Inc</div>
                <div className="text-sm text-gray-500">CCTV, Fire Alarms, Structured Cabling</div>
              </div>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Pending</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">Quote Review</div>
                <div className="text-sm text-gray-500">Cable Trays & Trunking - KES 450,000</div>
              </div>
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">Review</button>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">Budget Approval</div>
                <div className="text-sm text-gray-500">Specialized Power Equipment</div>
              </div>
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">Review</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
