/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiUrl } from "../lib/config";

export default function Home() {
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
    async function fetchInventoryStats() {
      if (!token) return;
      try {
        const res = await fetch(getApiUrl('/api/inventory'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const totalItems = data.length;
          const lowStockItems = data.filter((item: any) => item.currentStock <= item.minStock && item.currentStock > 0).length;
          const outOfStockItems = data.filter((item: any) => item.currentStock === 0).length;
          setInventoryStats({ totalItems, lowStockItems, outOfStockItems });
        }
      } catch (error) {
        console.error('Error fetching inventory stats:', error);
      }
    }
    fetchInventoryStats();
  }, []);

  // If user is logged in, show inventory dashboard
  if (user) {
    return <InventoryDashboard user={user} inventoryStats={inventoryStats} />;
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

// Inventory Dashboard Component
function InventoryDashboard({ user, inventoryStats }: { user: any, inventoryStats: any }) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}</h1>
        <p className="text-blue-100">Inventory Management Dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-blue-600">{inventoryStats.totalItems}</div>
          <div className="text-sm text-gray-600">Total Items</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-orange-600">{inventoryStats.lowStockItems}</div>
          <div className="text-sm text-gray-600">Low Stock Items</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-red-600">{inventoryStats.outOfStockItems}</div>
          <div className="text-sm text-gray-600">Out of Stock</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/inventory" className="bg-blue-600 text-white text-center px-4 py-3 rounded-md hover:bg-blue-700 transition-colors">
            Manage Inventory
          </Link>
          <Link href="/inventory" className="bg-green-600 text-white text-center px-4 py-3 rounded-md hover:bg-green-700 transition-colors">
            Add New Item
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <div className="font-medium">Portland Cement 50kg</div>
              <div className="text-sm text-gray-500">Stock added: +100 bags</div>
            </div>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">IN</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <div className="font-medium">Steel Reinforcement 12mm</div>
              <div className="text-sm text-gray-500">Stock used: -25 tonnes</div>
            </div>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">OUT</span>
          </div>
        </div>
      </div>
    </div>
  );
}