import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Haru — Let your day shine, even in a new Korea",
  description:
    "An English travel guide chatbot for visitors in Korea: food, stays, transport, photo spots and K-drama filming locations.",
};

// 휴대폰의 둥근 모서리·홈 막대 영역까지 화면을 쓰고, 안쪽 여백은 env(safe-area-inset-*)로 맞춘다
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
