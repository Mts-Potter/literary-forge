import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    { href: '/impressum', label: 'Impressum' },
    { href: '/datenschutz', label: 'Datenschutzerklärung' },
    { href: '/kontakt', label: 'Kontakt' },
    { href: '/urheberrecht', label: 'Urheberrecht' },
  ]

  return (
    <footer className="bg-[var(--background)] border-t border-[var(--border)] py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-xs text-[var(--muted)]">
          <div className="flex flex-wrap justify-center items-center gap-1">
            {footerLinks.map((link, index) => (
              <span key={link.href} className="flex items-center gap-1">
                <Link
                  href={link.href}
                  className="hover:text-[var(--foreground)] transition-colors underline"
                >
                  {link.label}
                </Link>
                {index < footerLinks.length - 1 && (
                  <span className="text-[var(--muted)]">|</span>
                )}
              </span>
            ))}
          </div>
          <div className="mt-2 text-[var(--muted)]">
            © {currentYear} Literary Forge. Alle Rechte vorbehalten.
          </div>
        </div>
      </div>
    </footer>
  )
}
