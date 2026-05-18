import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/nav-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://km-102-ranking-mvp.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MMA 분석 커뮤니티",
  description: "MMA 선수 투표, 경기 일정, 분석 게시판 — 격투기 팬 커뮤니티",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    title: "MMA 분석 커뮤니티",
    description: "MMA 선수 투표, 경기 일정, 분석 게시판 — 격투기 팬 커뮤니티",
    images: [
      {
        url: "/images/og-image.png",
        width: 1536,
        height: 1024,
        alt: "한국 MMA 커뮤니티",
      },
    ],
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "MMA 분석 커뮤니티",
    description: "MMA 선수 투표, 경기 일정, 분석 게시판 — 격투기 팬 커뮤니티",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 라이트 기본 + 다크모드 FOUC 방지 — 명시적 "dark"일 때만 다크 적용 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)] md:pb-0 md:pt-16`}
      >
        <NavBar />
        {children}
      </body>
    </html>
  );
}
