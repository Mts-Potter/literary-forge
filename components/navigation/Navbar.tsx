'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  // Check authentication and admin status
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)

      // Check admin status via API
      if (user) {
        try {
          const response = await fetch('/api/auth/is-admin')
          const data = await response.json()
          setIsAdmin(data.isAdmin)
        } catch (error) {
          console.error('Failed to check admin status:', error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
    }
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
      if (!session?.user) {
        setIsAdmin(false)
      } else {
        // Re-check admin status on auth change
        checkAuth()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Navigation links - admin only for admin users
  const navLinks = [
    { href: '/', icon: '🏠', label: 'Home' },
    { href: '/train', icon: '✍️', label: 'Training' },
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/settings', icon: '⚙️', label: 'Einstellungen' },
    // Admin only for admin users (not just authenticated)
    ...(isAdmin ? [{ href: '/admin/ingest', icon: '🔒', label: 'Admin' }] : [])
  ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <span className="text-xl font-bold text-blue-600">
              Literary Forge
            </span>
          </Link>

          {/* Desktop Navigation - Icon Only */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                className={`px-4 py-2 text-2xl rounded-md transition-all ${
                  pathname === link.href
                    ? 'bg-blue-600 text-white scale-110'
                    : 'text-gray-600 hover:bg-gray-100 hover:scale-105'
                }`}
                aria-label={link.label}
              >
                {link.icon}
              </Link>
            ))}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu - Icon + Text for clarity */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
