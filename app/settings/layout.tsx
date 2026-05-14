import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Einstellungen | The Franklin Method",
  description: "Verwalte deine Einstellungen für The Franklin Method.",
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
