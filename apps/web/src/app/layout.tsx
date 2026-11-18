import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import '@fontsource/noto-sans-ethiopic/400.css';
import '@fontsource/noto-sans-ethiopic/700.css';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Burger House', template: '%s | Burger House' },
  description:
    'Premium burgers, shakes and fries — freshly made daily. Scan. Order. Eat.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
