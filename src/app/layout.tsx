import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const clashDisplay = localFont({
  src: [
    { path: "./fonts/ClashDisplay-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ClashDisplay-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ClashDisplay-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Satoshi-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
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
        className={`${satoshi.variable} ${clashDisplay.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen relative`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Cinematic Ambient Background */}
          <div className="fixed inset-0 z-[-1] bg-background">
            <div className="absolute top-[-20%] left-[-10%] h-[50%] w-[50%] rounded-full bg-primary/25 blur-[150px] opacity-50 dark:opacity-40 mix-blend-multiply dark:mix-blend-screen" />
            <div className="absolute top-[40%] right-[-10%] h-[40%] w-[40%] rounded-full bg-primary/15 blur-[130px] opacity-30 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen" />
            <div className="absolute bottom-[-10%] left-[30%] h-[35%] w-[35%] rounded-full bg-accent-warm/10 blur-[120px] opacity-20 dark:opacity-15 mix-blend-multiply dark:mix-blend-screen" />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
