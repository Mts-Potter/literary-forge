import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    { href: '/methode', label: 'Die Methode' },
    { href: '/autoren', label: 'Autoren' },
    { href: '/buecher', label: 'Bücher' },
    { href: '/impressum', label: 'Impressum' },
    { href: '/datenschutz', label: 'Datenschutz' },
    { href: '/kontakt', label: 'Kontakt' },
    { href: '/urheberrecht', label: 'Urheberrecht' },
  ]

  return (
    <footer className="bg-[var(--background)] border-t border-[var(--border)] py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
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
            © {currentYear} The Franklin Method. Alle Rechte vorbehalten.
          </div>
        </div>
        <div className="max-w-2xl mx-auto text-center text-[10px] leading-relaxed text-[var(--muted)]">
          „The Franklin Method" (diese Seite) ist nicht verbunden mit der Franklin Method® von Eric Franklin
          (<a href="https://franklinmethod.com" rel="nofollow noopener" target="_blank" className="underline">franklinmethod.com</a>),
          einer Methode für somatische Bewegungsbildung. Die beiden Produkte arbeiten in unterschiedlichen Feldern.
        </div>
      </div>
    </footer>
  )
}
