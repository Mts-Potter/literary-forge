import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Einstellungen | Literary Forge",
  description: "Verwalten Sie Ihre Literary Forge Einstellungen und Präferenzen.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
