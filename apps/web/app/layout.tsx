import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import UserNav from './components/UserNav'
import Image from 'next/image'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Inventory Management System',
  description: 'Comprehensive inventory management system for tracking and managing stock',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-lg border-b relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo/Brand */}
                <div className="flex items-center">
                  <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    <Imagefdfd
                      src="/logo.png"
                      alt="CECL Logo"
                      className="h-10 w-auto"
                      width={40}
                      height={40}
                      priority
                    />
                  </Link>
                </div>
                
                {/* Navigation - UserNav handles everything */}
                <UserNav />
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
