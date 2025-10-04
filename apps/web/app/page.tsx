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
  const [inventoryCategoryCounts, setInventoryCategoryCounts] = useState({
    documents: 0,
    equipment: 0,
    ordersReceipts: 0
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
          if (isMounted) {
            setInventoryStats({ totalItems, lowStockItems, outOfStockItems });
            // equipment count mirrors total inventory items
            setInventoryCategoryCounts(prev => ({ ...prev, equipment: totalItems }));
          }
        }
      } catch (error) {
        console.error('Error fetching inventory stats:', error);
      }
    };

    const fetchOfficeDocumentsCount = async () => {
      try {
        const res = await fetch(getApiUrl('/api/upload/office-documents'));
        if (res.ok) {
          const docs = await res.json();
          if (isMounted) setInventoryCategoryCounts(prev => ({ ...prev, documents: Array.isArray(docs) ? docs.length : 0 }));
        }
      } catch {
        // ignore
      }
    };

    const fetchOrdersReceiptsCount = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
      if (!token || !isMounted) return;
      try {
        const headers = { Authorization: `Bearer ${token}` } as const;
        const projectsRes = await fetch(getApiUrl('/api/projects'), { headers });
        if (!projectsRes.ok) return;
        const projects: Array<{ id: string }> = await projectsRes.json();
        const results = await Promise.all(
          projects.map(async (p) => {
            const r = await fetch(getApiUrl(`/api/projects/${p.id}/order-templates`), { headers });
            if (!r.ok) return 0;
            const templates = await r.json();
            return Array.isArray(templates) ? templates.length : 0;
          })
        );
        const count = results.reduce((a, b) => a + b, 0);
        if (isMounted) setInventoryCategoryCounts(prev => ({ ...prev, ordersReceipts: count }));
      } catch {
        // ignore
      }
    };

    // initial load
    fetchInventoryStats();
    fetchOfficeDocumentsCount();
    fetchOrdersReceiptsCount();

    // poll every 15s
    const intervalId = setInterval(() => {
      fetchInventoryStats();
      fetchOfficeDocumentsCount();
      fetchOrdersReceiptsCount();
    }, 15000);

    // refresh when tab gains focus/visibility
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchInventoryStats();
        fetchOfficeDocumentsCount();
        fetchOrdersReceiptsCount();
      }
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
    return <RoleBasedDashboard user={user} inventoryStats={inventoryStats} projectStats={projectStats} inventoryCategoryCounts={inventoryCategoryCounts} />;
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
              className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Login
            </a>
            <a 
              href="/auth/signup" 
              className="bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
function RoleBasedDashboard({ user, inventoryStats, projectStats, inventoryCategoryCounts }: { user: any, inventoryStats: any, projectStats: any, inventoryCategoryCounts: any }) {
  if (user.role === 'SITE_SUPERVISOR') {
    return <SiteSupervisorDashboard user={user} projectStats={projectStats} />;
  }

  // Full access for Chairman and Chairman's PA; others fall back to full dashboard for now
  return <TMSDashboard user={user} projectStats={projectStats} inventoryCategoryCounts={inventoryCategoryCounts} />;
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
function TMSDashboard({ user, projectStats, inventoryCategoryCounts }: { user: any, projectStats: any, inventoryCategoryCounts: any }) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}</h1>
        <p className="text-blue-100">TMS Management Dashboard</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Project Stats */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
              <span className="text-2xl text-white">🏗️</span>
            </div>
            <div className="ml-4">
              <div className="text-3xl font-bold text-gray-900">{projectStats.totalProjects}</div>
              <div className="text-sm text-gray-600 font-medium">Total Projects</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
              <span className="text-2xl text-white">⚡</span>
            </div>
            <div className="ml-4">
              <div className="text-3xl font-bold text-gray-900">{projectStats.ongoingProjects}</div>
              <div className="text-sm text-gray-600 font-medium">Active Projects</div>
            </div>
          </div>
        </div>

        {/* Inventory Categories */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
              <span className="text-2xl text-white">📄</span>
            </div>
            <div className="ml-4">
              <div className="text-3xl font-bold text-gray-900">{inventoryCategoryCounts.documents}</div>
              <div className="text-sm text-gray-600 font-medium">Documents</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl">
              <span className="text-2xl text-white">🛠️</span>
            </div>
            <div className="ml-4">
              <div className="text-3xl font-bold text-gray-900">{inventoryCategoryCounts.equipment}</div>
              <div className="text-sm text-gray-600 font-medium">Equipment</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
              <span className="text-2xl text-white">🧾</span>
            </div>
            <div className="ml-4">
              <div className="text-3xl font-bold text-gray-900">{inventoryCategoryCounts.ordersReceipts}</div>
              <div className="text-sm text-gray-600 font-medium">Orders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Status Overview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="text-2xl mr-3">📊</span>
          Project Status Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-600 mb-2">{projectStats.toStartProjects}</div>
            <div className="text-sm text-gray-600 font-medium">To Start</div>
            <div className="text-xs text-gray-500 mt-1">Ready to begin</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">{projectStats.ongoingProjects}</div>
            <div className="text-sm text-gray-600 font-medium">Ongoing</div>
            <div className="text-xs text-gray-500 mt-1">Active projects</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">{projectStats.completedProjects}</div>
            <div className="text-sm text-gray-600 font-medium">Completed</div>
            <div className="text-xs text-gray-500 mt-1">Finished projects</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="text-2xl mr-3">⚡</span>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/inventory" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center px-6 py-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1">
            <div className="text-2xl mb-2">📦</div>
            <div className="font-medium">Manage Inventory</div>
            <div className="text-sm opacity-90">View & manage items</div>
          </Link>
          <Link href="/projects" className="bg-gradient-to-r from-green-500 to-green-600 text-white text-center px-6 py-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1">
            <div className="text-2xl mb-2">🏗️</div>
            <div className="font-medium">Manage Projects</div>
            <div className="text-sm opacity-90">View & manage projects</div>
          </Link>
          <Link href="/inventory" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center px-6 py-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1">
            <div className="text-2xl mb-2">➕</div>
            <div className="font-medium">Add Item</div>
            <div className="text-sm opacity-90">Add new inventory</div>
          </Link>
          <Link href="/projects" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center px-6 py-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1">
            <div className="text-2xl mb-2">➕</div>
            <div className="font-medium">Create Project</div>
            <div className="text-sm opacity-90">Start new project</div>
          </Link>
        </div>
      </div>

      {/* Project Analytics */}
      <ProjectAnalytics user={user} />

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="text-2xl mr-3">🔧</span>
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-4 animate-pulse"></div>
            <div>
              <div className="font-semibold text-green-900">Database</div>
              <div className="text-sm text-green-700">Connected & Healthy</div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-4 animate-pulse"></div>
            <div>
              <div className="font-semibold text-green-900">API Services</div>
              <div className="text-sm text-green-700">Online & Responsive</div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-4 animate-pulse"></div>
            <div>
              <div className="font-semibold text-green-900">Authentication</div>
              <div className="text-sm text-green-700">Active & Secure</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}