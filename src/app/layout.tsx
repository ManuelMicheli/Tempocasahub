import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "TempoCasa CRM",
  description: "CRM per agenti immobiliari TempoCasa",
};

import { ThemeProvider } from '@/components/theme-provider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen relative`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Cinematic Ambient Background */}
          <div className="fixed inset-0 z-[-1] bg-background">
            <div className="absolute top-[-20%] left-[-10%] h-[50%] w-[50%] rounded-full bg-primary/30 blur-[130px] opacity-60 dark:opacity-50 mix-blend-multiply dark:mix-blend-screen transition-all duration-1000" />
            <div className="absolute top-[40%] right-[-10%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[120px] opacity-40 dark:opacity-40 mix-blend-multiply dark:mix-blend-screen animate-pulse transition-all duration-1000" />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
