import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Anmelden | The Franklin Method",
  description: "Melde dich bei The Franklin Method an, um dein personalisiertes Schreibtraining fortzusetzen.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
