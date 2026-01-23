'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useDarkMode } from '@/hooks/use-dark-mode'

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDarkMode] = useDarkMode()

  const navLinks = [
    { href: '/', label: '🏠 Home' },
    { href: '/train', label: '✍️ Train' },
    { href: '/admin/ingest', label: '📚 Import' }
  ]

  // Theme classes
  const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-white'
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200'
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const hoverBgClass = isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
  const activeBgClass = isDarkMode ? 'bg-gray-800' : 'bg-blue-100'
  const activeTextClass = isDarkMode ? 'text-blue-400' : 'text-blue-700'

  return (
    <nav className={`${bgClass} border-b ${borderClass} sticky top-0 z-50 shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <span className={`text-xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              Literary Forge
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  pathname === link.href
                    ? `${activeBgClass} ${activeTextClass}`
                    : `${textClass} ${hoverBgClass}`
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden flex items-center p-2 ${textClass} ${hoverBgClass} rounded-md`}
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-md font-medium ${
                  pathname === link.href
                    ? `${activeBgClass} ${activeTextClass}`
                    : `${textClass} ${hoverBgClass}`
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
