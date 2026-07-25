import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// 로컬 번들 폰트 — 외부 CDN 런타임 의존 없음(next/font/local이 빌드 시 self-host).
// docs/DESIGN-SYSTEM.md §3: 본문 산스 Pretendard + 감성 세리프 Nanum Myeongjo.
const pretendard = localFont({
  src: '../assets/fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
});

const nanumMyeongjo = localFont({
  src: [
    { path: '../assets/fonts/NanumMyeongjo-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../assets/fonts/NanumMyeongjo-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../assets/fonts/NanumMyeongjo-ExtraBold.ttf', weight: '800', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-nanum-myeongjo',
});

export const metadata: Metadata = {
  title: '분실물 보관소, 3층 D열',
  description: '기억과 상실 — 웹 비주얼노벨 데모',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${nanumMyeongjo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
