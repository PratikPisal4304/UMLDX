"use client"; // Treat this file as a Client Component


import localFont from "next/font/local";
import Script from "next/script";
import { useEffect } from "react";
import "./globals.css";

// Import Mermaid.js typings by augmenting the global Window interface
declare global {
  interface Window {
    mermaid: {
      initialize: (config: Record<string, unknown>) => void;
      contentLoaded: () => void;
      render: (id: string, graphDefinition: string, callback?: (svgCode: string) => void) => void;
    };
  }
}

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.mermaid) {
      // Initialize Mermaid.js when the component mounts
      window.mermaid.initialize({ startOnLoad: true });
    }
  }, []);

  return (
    <html lang="en">
      <head>
        {/* Load the Mermaid.js script */}
        <Script
          src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
