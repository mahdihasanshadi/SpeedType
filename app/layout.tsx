import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import { GuestMigration } from "@/components/providers/guest-migration";
import { ThemeScript } from "@/components/theme-script";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";
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
  title: "SpeedType — test your typing speed",
  description:
    "Take a typing speed test, track your WPM curve over time, and improve with practice drills.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Server-rendered default before ThemeScript corrects it pre-paint — see design-system.md.
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <GuestMigration />
          <Header />
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
