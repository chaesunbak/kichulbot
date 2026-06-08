import './globals.css';

import { Toaster } from '@kichulbot/ui/components/ui/sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { OverlayProvider } from 'overlay-kit';

import { cn } from '@/shared/lib/utils';

const geistHeading = Geist({ subsets: ['latin'], variable: '--font-heading' });
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  applicationName: '기출봇',
  title: {
    default: '기출봇',
    template: `%s | 기출봇}`,
  },
  keywords: ['기출', '기출문제', '한국사능력검정시험', '한능검'],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    other: {
      'naver-site-verification': '80cca6f686e28e00a8433f3682ce4122562137bf',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={cn(
        'h-full antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-sans',
        inter.variable,
        geistHeading.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <NuqsAdapter>
            <OverlayProvider>{children}</OverlayProvider>
          </NuqsAdapter>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
