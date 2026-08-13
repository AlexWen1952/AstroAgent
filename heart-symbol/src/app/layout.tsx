import type { Metadata, Viewport } from 'next';
import { LocaleProvider } from '@/context/LocaleContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Heart Symbol · 心符',
  description:
    'A bilingual reflection app using original Heart Symbols. For women navigating love, career, money, family, and self.',
  keywords: ['reflection', 'self-discovery', 'bilingual', '心符', '自我反思'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-warm-bg font-sans antialiased">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
