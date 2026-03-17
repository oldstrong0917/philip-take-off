import type { Metadata } from "next";
import {
  Noto_Serif_TC,
  Noto_Sans_TC,
  Playfair_Display,
  Open_Sans,
  Kalam,
} from "next/font/google";
import "./globals.css";
import ApolloWrapper from "@/components/ApolloWrapper";

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-serif-tc",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-sans-tc",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "永恆的思念 — 紀念父親",
  description: "一個紀念父親的網站，讓親朋好友一同追思與弔唁。",
  icons: { icon: "/globe.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body
        className={`${notoSerifTC.variable} ${notoSansTC.variable} ${playfairDisplay.variable} ${openSans.variable} ${kalam.variable} antialiased`}
      >
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
