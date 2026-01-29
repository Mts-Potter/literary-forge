import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Login | Literary Forge",
  description: "Melden Sie sich bei Literary Forge an, um auf Ihr personalisiertes Schreibtraining zuzugreifen.",
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
