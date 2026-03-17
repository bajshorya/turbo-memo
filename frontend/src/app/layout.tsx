import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const sora = localFont({
  src: "../fonts/Sora-VariableFont.ttf",
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Garden Finance - Agent Dashboard",
  description: "AI Agent Dashboard for Garden Finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, sora.variable)} suppressHydrationWarning>
      <body
        className={`${sora.variable} antialiased bg-[#e4ebf2]`}
      >
        {children}
      </body>
    </html>
  );
}
