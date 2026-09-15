import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Merriweather, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import './ledger.css';
import { PwaRegister } from './pwa-register';

const geist = Plus_Jakarta_Sans({
  variable: '--font-geist',
  subsets: ['latin'],
});
const heading = Merriweather({ variable: '--font-heading', subsets: ['latin'], weight: ['400', '700'] });

const devanagari = Noto_Sans_Devanagari({
  variable: '--font-devanagari',
  subsets: ['devanagari'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sentrio-shift-diary.cloudy-tick-1574.chatgpt.site'),
  title: 'Sentrio — Self Attendance & Shift Diary',
  description:
    'A private, offline-first self-attendance and shift diary for industrial workers.',
  applicationName: 'Sentrio',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/sentrio-brand.svg', type: 'image/svg+xml' },
      { url: '/sentrio-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/sentrio-icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Sentrio',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Sentrio — Self Attendance & Shift Diary',
    description: 'Your shift. Your record. A private, offline-first attendance diary.',
    url: '/',
    siteName: 'Sentrio',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Sentrio — Your shift. Your record.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sentrio — Self Attendance & Shift Diary',
    description: 'Your shift. Your record. A private, offline-first attendance diary.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#46543d',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${heading.variable} ${devanagari.variable}`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
