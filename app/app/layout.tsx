import type { Metadata, Viewport } from 'next';
import { Geist, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
});

const devanagari = Noto_Sans_Devanagari({
  variable: '--font-devanagari',
  subsets: ['devanagari'],
});

export const metadata: Metadata = {
  title: 'Sentrio — Self Attendance & Shift Diary',
  description:
    'A private, offline-first self-attendance and rotating-shift diary for industrial workers.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${devanagari.variable}`}>
        {children}
      </body>
    </html>
  );
}
