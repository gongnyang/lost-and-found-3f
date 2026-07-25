import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'miyensi',
  description: '기억과 상실 — 웹 비주얼노벨 데모',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
