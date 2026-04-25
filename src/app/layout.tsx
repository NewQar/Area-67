import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AIDa — Pembantu Bantuan Anda',
  description:
    'AIDa membantu rakyat Malaysia menemui bantuan kerajaan, zakat dan kewangan yang anda layak terima.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'AIDa',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a7c4a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body>
        <main className="mx-auto max-w-md min-h-screen flex flex-col">{children}</main>
      </body>
    </html>
  );
}
