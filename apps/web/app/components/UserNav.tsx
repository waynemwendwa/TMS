'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getApiUrl } from '../../lib/config';
import LogoutButton from './LogoutButton';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
    async function fetchUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(getApiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('tms_token');
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        localStorage.removeItem('tms_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('tms_token');
      if (!newToken && user) {
        setUser(null);
      } else if (newToken && !user) {
        fetchUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const getRoleBasedNavItems = (role: string) => {
    // All roles now only see inventory
    return [
      { href: '/inventory', label: 'Inventory' }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-3">
        <Link 
          href="/auth/login" 
          className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
        >
          Login
        </Link>
        <Link 
          href="/auth/signup" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  const navItems = getRoleBasedNavItems(user.role);

  return (
    <div className="flex items-center space-x-6">
      {/* Role-based navigation */}
      <div className="hidden lg:flex space-x-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button className="text-gray-700 hover:text-blue-600 p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* User info and logout */}
      <div className="flex items-center space-x-3">
        <div className="hidden sm:block text-right">
          <div className="text-sm font-semibold text-gray-900">{user.name}</div>
          <div className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</div>
        </div>
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
