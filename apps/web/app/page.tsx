/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiUrl } from "../lib/config";
import ProjectAnalytics from "./components/ProjectAnalytics";

export default function Home() {
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });
  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    toStartProjects: 0,
    ongoingProjects: 0,
    completedProjects: 0
  });

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

  useEffect(() => {
    let isMounted = true;

    const fetchInventoryStats = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
      if (!token || !isMounted) return;
      try {
        const res = await fetch(getApiUrl('/api/inventory'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const totalItems = data.length;
          const lowStockItems = data.filter((item: any) => item.currentStock <= item.minStock && item.currentStock > 0).length;
          const outOfStockItems = data.filter((item: any) => item.currentStock === 0).length;
          if (isMounted) setInventoryStats({ totalItems, lowStockItems, outOfStockItems });
        }
      } catch (error) {
        console.error('Error fetching inventory stats:', error);
      }
    };

    // initial load
    fetchInventoryStats();

    // poll every 15s
    const intervalId = setInterval(fetchInventoryStats, 15000);

    // refresh when tab gains focus/visibility
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchInventoryStats();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
    async function fetchProjectStats() {
      if (!token) return;
      try {
        const res = await fetch(getApiUrl('/api/projects'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const totalProjects = data.length;
          const toStartProjects = data.filter((project: any) => project.status === 'TO_START').length;
          const ongoingProjects = data.filter((project: any) => project.status === 'ONGOING').length;
          const completedProjects = data.filter((project: any) => project.status === 'COMPLETED').length;
          setProjectStats({ totalProjects, toStartProjects, ongoingProjects, completedProjects });
        }
      } catch (error) {
        console.error('Error fetching project stats:', error);
      }
    }
    fetchProjectStats();
  }, []);

  // If user is logged in, show role-based dashboard
  if (user) {
    return <RoleBasedDashboard user={user} inventoryStats={inventoryStats} projectStats={projectStats} />;
  }

  // Landing page for non-logged-in users
  return (
    <div 
      className="bg-contain bg-top min-h-screen bg-no-repeat relative"
      style={{
        backgroundImage: "url('/shortest.png')"
      }}
    >
      <div className="relative z-10 space-y-8 p-6">
        {/* Hero Section */}
        <div className="text-center pt-20 mt-30">
          <p className="text-2xl text-gray-900 max-w-4xl mx-auto mb-8 font-bold">
            Streamline your inventory management with comprehensive tracking, 
            stock monitoring, and automated alerts.
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
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Inventory Management System</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6">
              <div className="w-16 h-16 bg-blue-500 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Inventory Tracking</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Real-time stock levels
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Automated low stock alerts
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Stock movement history
                </li>
              </ul>
            </div>

            <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6">
              <div className="w-16 h-16 bg-green-500 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Key Features</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Add/Remove stock
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Stock adjustments
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Category management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Location tracking
                </li>
              </ul>
            </div>

            <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6">
              <div className="w-16 h-16 bg-purple-500 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Access Control</h3>
              <p className="text-sm text-gray-600 mb-4">
                Role-based access ensures secure inventory management with proper user permissions.
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

// Role-based Dashboard Router
function RoleBasedDashboard({ user, inventoryStats, projectStats }: { user: any, inventoryStats: any, projectStats: any }) {
  if (user.role === 'SITE_SUPERVISOR') {
    return <SiteSupervisorDashboard user={user} projectStats={projectStats} />;
  }

  // Full access for Chairman and Chairman's PA; others fall back to full dashboard for now
  return <TMSDashboard user={user} inventoryStats={inventoryStats} projectStats={projectStats} />;
}

// Limited dashboard for Site Supervisors (will refine based on your specs)
function SiteSupervisorDashboard({ user, projectStats }: { user: any, projectStats: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}</h1>
        <p className="text-blue-100">Site Supervisor Dashboard</p>
      </div>

      {/* Project Stats (read-only overview) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">🏗️</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-600">{projectStats.ongoingProjects}</div>
              <div className="text-sm text-gray-600">Assigned Project</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-blue-600">BOQ</div>
              <div className="text-sm text-gray-600">Bill of Quantities</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-purple-600">Orders</div>
              <div className="text-sm text-gray-600">Order Management</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions for Site Supervisors */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/projects" className="bg-green-600 text-white text-center px-4 py-3 rounded-md hover:bg-green-700 transition-colors">
            🏗️ View My Project
          </Link>
          <Link href="/projects" className="bg-blue-600 text-white text-center px-4 py-3 rounded-md hover:bg-blue-700 transition-colors">
            📋 View BOQ Templates
          </Link>
          <Link href="/projects" className="bg-purple-600 text-white text-center px-4 py-3 rounded-md hover:bg-purple-700 transition-colors">
            📝 Create Order
          </Link>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📋 Order Management Guide</h4>
          <p className="text-sm text-blue-700">
            Create orders using either the <strong>Order Template</strong> (fill out form) or <strong>Upload Order Document</strong> (PDF/Excel). 
            Compare your orders with BOQ to ensure proper material usage.
          </p>
        </div>
      </div>

      {/* Project Analytics - Limited to assigned project */}
      <ProjectAnalytics user={user} />
    </div>
  );
}

// TMS Dashboard Component
function TMSDashboard({ user, inventoryStats, projectStats }: { user: any, inventoryStats: any, projectStats: any }) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}</h1>
        <p className="text-blue-100">TMS Management Dashboard</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Inventory Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-blue-600">{inventoryStats.totalItems}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-orange-600">{inventoryStats.lowStockItems}</div>
              <div className="text-sm text-gray-600">Low Stock</div>
            </div>
          </div>
        </div>

        {/* Project Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">🏗️</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-600">{projectStats.totalProjects}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-purple-600">{projectStats.ongoingProjects}</div>
              <div className="text-sm text-gray-600">Active Projects</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">📦</span>
            Inventory Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-gray-900">Total Items</div>
                <div className="text-sm text-gray-500">All inventory items</div>
              </div>
              <div className="text-2xl font-bold text-blue-600">{inventoryStats.totalItems}</div>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-gray-900">Low Stock Items</div>
                <div className="text-sm text-gray-500">Items below minimum stock</div>
              </div>
              <div className="text-2xl font-bold text-orange-600">{inventoryStats.lowStockItems}</div>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-gray-900">Out of Stock</div>
                <div className="text-sm text-gray-500">Items with zero stock</div>
              </div>
              <div className="text-2xl font-bold text-red-600">{inventoryStats.outOfStockItems}</div>
            </div>
          </div>
        </div>

        {/* Project Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🏗️</span>
            Project Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-gray-900">To Start</div>
                <div className="text-sm text-gray-500">Projects ready to begin</div>
              </div>
              <div className="text-2xl font-bold text-gray-600">{projectStats.toStartProjects}</div>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-gray-900">Ongoing</div>
                <div className="text-sm text-gray-500">Active projects</div>
              </div>
              <div className="text-2xl font-bold text-blue-600">{projectStats.ongoingProjects}</div>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-gray-900">Completed</div>
                <div className="text-sm text-gray-500">Finished projects</div>
              </div>
              <div className="text-2xl font-bold text-green-600">{projectStats.completedProjects}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/inventory" className="bg-blue-600 text-white text-center px-4 py-3 rounded-md hover:bg-blue-700 transition-colors">
            📦 Manage Inventory
          </Link>
          <Link href="/projects" className="bg-green-600 text-white text-center px-4 py-3 rounded-md hover:bg-green-700 transition-colors">
            🏗️ Manage Projects
          </Link>
          <Link href="/inventory" className="bg-orange-600 text-white text-center px-4 py-3 rounded-md hover:bg-orange-700 transition-colors">
            ➕ Add Inventory Item
          </Link>
          <Link href="/projects" className="bg-purple-600 text-white text-center px-4 py-3 rounded-md hover:bg-purple-700 transition-colors">
            ➕ Create Project
          </Link>
        </div>
      </div>

      {/* Project Analytics */}
      <ProjectAnalytics user={user} />

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <div className="font-medium text-green-900">Database</div>
              <div className="text-sm text-green-700">Connected</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <div className="font-medium text-green-900">API</div>
              <div className="text-sm text-green-700">Online</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <div className="font-medium text-green-900">Authentication</div>
              <div className="text-sm text-green-700">Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}