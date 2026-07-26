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

// Nanum Myeongjo는 원본 TTF(3종 9.1MB) 대신 woff2 서브셋(완성형 한글 U+AC00-D7A3 +
// 라틴 + 본문 문장부호)을 쓴다. 원본은 pipeline/fonts-backup/에 보관.
const nanumMyeongjo = localFont({
  src: [
    { path: '../assets/fonts/NanumMyeongjo-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/NanumMyeongjo-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../assets/fonts/NanumMyeongjo-ExtraBold.woff2', weight: '800', style: 'normal' },
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
