import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevRelOS — AI-Powered Developer Relations Platform",
  description: "The modern operating system for Developer Relations teams, developer advocates, and open-source maintainers.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased selection:bg-[#FF6B35]/20 selection:text-[#FF6B35]">
        {children}
      </body>
    </html>
  );
}
