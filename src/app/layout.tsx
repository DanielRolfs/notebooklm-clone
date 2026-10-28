import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
import "./globals.css";

const font = Google_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-app" });

export const metadata: Metadata = {
  title: "NotebookLM Clone",
  description: "Chat with your sources",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${font.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
