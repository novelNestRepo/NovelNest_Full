// TODO: Reponsive.

import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import AppLayout from "@/components/layout/AppLayout";
import QueryProvider from "@/lib/providers/QueryProvider";
import NextTopLoader from 'nextjs-toploader';
import ChatBot from "@/components/custom/ChatBot";
import { Analytics } from "@vercel/analytics/react";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NovelNest",
  description: "Track your reading progress and discover new books.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfairDisplay.variable} ${inter.variable} antialiased`}
      >
        <NextTopLoader color="hsl(var(--primary))" showSpinner={false} />
        <QueryProvider>
          <TooltipProvider>
            <AppLayout>
              {children}
              <Analytics />
            </AppLayout>
            <Toaster />
            <ChatBot />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
