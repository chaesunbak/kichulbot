import './globals.css';

import { Toaster } from '@kichulbot/ui/components/ui/sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { OverlayProvider } from 'overlay-kit';

import { LegacyAuthStorageCleaner } from '@/features/auth/components/legacy-auth-storage-cleaner';
import { cn } from '@/shared/lib/utils';

const geistHeading = Geist({ subsets: ['latin'], variable: '--font-heading' });
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '기출봇',
  description: '기출문제 풀이 기록을 저장하고 약점을 분석해주는 학습 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
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
        <LegacyAuthStorageCleaner />
        <NuqsAdapter>
          <OverlayProvider>{children}</OverlayProvider>
        </NuqsAdapter>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
