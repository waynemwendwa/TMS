/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import FinanceProcurementDashboard from "./components/FinanceProcurementDashboard";
import { getApiUrl } from "../lib/config";

export default function Home() {
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
    async function fetchMe() {
      if (!token) return;
      try {
        const res = await fetch(getApiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {}
    }
    fetchMe();
  }, []);
  // If user is logged in, redirect to their role-specific dashboard
  if (user) {
    if (user.role === 'CHAIRMAN' || user.role === 'CHAIRMAN_PA') {
      return <ChairmanDashboard user={user} />;
    } else if (user.role === 'SITE_SUPERVISOR') {
      return <SiteSupervisorDashboard user={user} />;
    } else if (user.role === 'FINANCE_PROCUREMENT') {
      return <FinanceProcurementDashboard user={user} />;
    }
  }

  // Landing page for non-logged-in users
  return (
    <div 
      className="bg-contain bg-top min-h-screen bg-no-repeat relative"
      style={{
        backgroundImage: "url('/shortest.png')"
      }}
    >
      {/* <div className="absolute inset-0 bg-black bg-opacity-30"></div> */}
    
      <div className="relative z-10 space-y-8 p-6">
        {/* Hero Section */}
        <div className="text-center pt-20 mt-30">
          <p className="text-2xl text-gray-900 max-w-4xl mx-auto mb-8 font-bold">
            Streamline your construction project management with comprehensive tender handling, 
            supplier management, and inventory tracking.
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href="/auth/login" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Login
            </a>
            <a 
              href="/auth/signup" 
              className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Sign Up
            </a>
          </div>
        </div>

        {/* System Overview */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6">
              <div className="w-16 h-16 bg-blue-500 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">User Roles</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  <strong>Chairman:</strong> Full system access and oversight
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  <strong>Chairman&apos;s PA:</strong> Administrative and document management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                  <strong>Site Supervisor:</strong> Project and inventory management
                </li>
              </ul>
            </div>

            <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6">
              <div className="w-16 h-16 bg-green-500 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-2xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Key Features</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Project Management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Supplier Management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Inventory Tracking
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Procurement Planning
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Reports & Analytics
                </li>
              </ul>
            </div>

            <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6">
              <div className="w-16 h-16 bg-purple-500 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Access Control</h3>
              <p className="text-sm text-gray-600 mb-4">
                Role-based access ensures each user sees only what they need to perform their duties effectively.
              </p>
              <div className="text-center">
                <a 
                  href="/auth/login" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Get Started →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chairman Dashboard Component
function ChairmanDashboard({ user }: { user: any }) {
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalSuppliers: 0,
    pendingApprovals: 0,
    activeOrders: 0
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
    async function fetchData() {
      if (!token) return;
      try {

        // Fetch dashboard stats
        const statsRes = await fetch(getApiUrl('/api/dashboard/chairman'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    }
    fetchData();
  }, []);
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}</h1>
        <p className="text-blue-100">Chairman Dashboard - Full System Access</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-blue-600">{stats.activeProjects}</div>
          <div className="text-sm text-gray-600">Active Projects</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-green-600">{stats.totalSuppliers}</div>
          <div className="text-sm text-gray-600">Suppliers</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</div>
          <div className="text-sm text-gray-600">Pending Approvals</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-purple-600">{stats.activeOrders}</div>
          <div className="text-sm text-gray-600">Active Orders</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/projects/create" className="bg-blue-600 text-white text-center px-4 py-3 rounded-md hover:bg-blue-700 transition-colors">
            Create New Project
          </Link>
          <Link href="/suppliers" className="bg-green-600 text-white text-center px-4 py-3 rounded-md hover:bg-green-700 transition-colors">
            Manage Suppliers
          </Link>
          <Link href="/procurement" className="bg-purple-600 text-white text-center px-4 py-3 rounded-md hover:bg-purple-700 transition-colors">
            Procurement Plans
          </Link>
          <Link href="/reports" className="bg-orange-600 text-white text-center px-4 py-3 rounded-md hover:bg-orange-700 transition-colors">
            View Reports
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">Kisumu County Assembly</div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">Nairobi Office Complex</div>
                <div className="text-sm text-gray-500">Planning Phase</div>
              </div>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Planning</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">Supplier Registration</div>
                <div className="text-sm text-gray-500">ABC Construction Ltd</div>
              </div>
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">Review</button>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">Procurement Plan</div>
                <div className="text-sm text-gray-500">Kisumu Project Phase 2</div>
              </div>
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">Review</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Site Supervisor Dashboard Component
function SiteSupervisorDashboard({ user }: { user: any }) {
  const [stats, setStats] = useState({
    myProjects: 0,
    inventoryItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
    async function fetchStats() {
      if (!token) return;
      try {
        const res = await fetch(getApiUrl('/api/dashboard/site-supervisor'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching site-supervisor dashboard stats:', error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}</h1>
        <p className="text-green-100">Site Supervisor Dashboard - Project & Inventory Management</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-blue-600">{stats.myProjects}</div>
          <div className="text-sm text-gray-600">My Projects</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-green-600">{stats.inventoryItems}</div>
          <div className="text-sm text-gray-600">Inventory Items</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-orange-600">{stats.lowStockItems}</div>
          <div className="text-sm text-gray-600">Low Stock Items</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-red-600">{stats.outOfStockItems}</div>
          <div className="text-sm text-gray-600">Out of Stock</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/projects" className="bg-blue-600 text-white text-center px-4 py-3 rounded-md hover:bg-blue-700 transition-colors">
            View My Projects
          </Link>
          <Link href="/inventory" className="bg-green-600 text-white text-center px-4 py-3 rounded-md hover:bg-green-700 transition-colors">
            Manage Inventory
          </Link>
          <Link href="/reports" className="bg-purple-600 text-white text-center px-4 py-3 rounded-md hover:bg-purple-700 transition-colors">
            Generate Reports
          </Link>
        </div>
      </div>

      {/* My Projects */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Active Projects</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Kisumu County Assembly - Phase 1</div>
              <div className="text-sm text-gray-500">Foundation & Structure</div>
              <div className="text-xs text-gray-400">Started: Jan 15, 2024</div>
            </div>
            <div className="text-right">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">In Progress</span>
              <div className="text-sm text-gray-500 mt-1">65% Complete</div>
            </div>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Nairobi Office Complex</div>
              <div className="text-sm text-gray-500">Planning & Design</div>
              <div className="text-xs text-gray-400">Started: Feb 1, 2024</div>
            </div>
            <div className="text-right">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Planning</span>
              <div className="text-sm text-gray-500 mt-1">25% Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Alerts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-red-50 border-l-4 border-red-400 rounded">
            <div className="flex-1">
              <div className="font-medium text-red-800">Portland Cement 50kg</div>
              <div className="text-sm text-red-600">Out of Stock - 0 bags remaining</div>
            </div>
            <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Order Now</button>
          </div>
          <div className="flex items-center p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="flex-1">
              <div className="font-medium text-yellow-800">Steel Reinforcement 12mm</div>
              <div className="text-sm text-yellow-600">Low Stock - 2.5 tonnes remaining</div>
            </div>
            <button className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700">Restock</button>
          </div>
        </div>
      </div>
    </div>
  );
}
