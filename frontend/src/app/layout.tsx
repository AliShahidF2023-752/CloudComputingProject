import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ContentGuard AI - AI & Plagiarism Detection Tool",
  description: "Detect AI-generated content and plagiarism instantly. Get detailed reports with highlighted sections and one-click rephrasing to ensure your content is original.",
  keywords: "AI detection, plagiarism checker, content verification, AI content detector, originality checker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
