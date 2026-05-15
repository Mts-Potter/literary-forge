'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, type ComponentType } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FeedbackModal } from '@/components/feedback/FeedbackModal'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import {
  Home,
  PenLine,
  LayoutDashboard,
  Settings,
  Lock,
  MessageSquare,
  Menu,
  X,
  BookOpen,
  Library,
  Sparkles,
  LogIn,
} from 'lucide-react'

type LucideIcon = ComponentType<{ size?: number; className?: string }>

interface NavLink {
  href: string
  label: string
  Icon: LucideIcon
}

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
      if (!session?.user) {
        setIsAdmin(false)
      } else {
        checkAuth()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const publicLinks: NavLink[] = [
    { href: '/', label: 'Home', Icon: Home },
    { href: '/methode', label: 'Methode', Icon: BookOpen },
    { href: '/buecher', label: 'Bücher', Icon: Library },
    { href: '/demo', label: 'Demo', Icon: Sparkles },
  ]

  const authLinks: NavLink[] = [
    { href: '/train', label: 'Training', Icon: PenLine },
    { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/settings', label: 'Einstellungen', Icon: Settings },
    ...(isAdmin ? [{ href: '/admin/ingest', label: 'Admin', Icon: Lock }] : []),
  ]

  const navLinks: NavLink[] = isAuthenticated
    ? [{ href: '/', label: 'Home', Icon: Home }, ...authLinks]
    : publicLinks

  return (
    <nav className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <span className="font-[family-name:var(--font-fraunces)] text-xl font-light text-[var(--foreground)] tracking-tight">
              The Franklin Method
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navLinks.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                className={`inline-flex items-center justify-center w-10 h-10 transition-colors relative ${
                  pathname === href
                    ? 'text-[var(--foreground)] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-[var(--foreground)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon size={20} />
              </Link>
            ))}

            {isAuthenticated && (
              <button
                onClick={() => setFeedbackModalOpen(true)}
                title="Feedback senden"
                aria-label="Feedback senden"
                className="inline-flex items-center justify-center w-10 h-10 rounded-md text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)] transition-colors"
              >
                <MessageSquare size={20} />
              </button>
            )}

            {!isAuthenticated && (
              <Link
                href="/login"
                title="Anmelden"
                aria-label="Anmelden"
                className="inline-flex items-center justify-center w-10 h-10 rounded-md text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)] transition-colors"
              >
                <LogIn size={20} />
              </Link>
            )}

            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-md text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {navLinks.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-colors ${
                  pathname === href
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}

            {isAuthenticated && (
              <button
                onClick={() => {
                  setFeedbackModalOpen(true)
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-md font-medium text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)] transition-colors"
              >
                <MessageSquare size={20} />
                <span>Feedback senden</span>
              </button>
            )}

            {!isAuthenticated && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-md font-medium text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)] transition-colors"
              >
                <LogIn size={20} />
                <span>Anmelden</span>
              </Link>
            )}
          </div>
        )}
      </div>

      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
      />
    </nav>
  )
}
