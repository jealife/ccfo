import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "CCFO | Amateur Football Tournament",
  description: "Digital management system for amateur football tournaments. Register your team, track results and standings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={cn(
          inter.variable,
          outfit.variable,
          "font-inter bg-background text-foreground min-h-screen"
        )}
      >
        {children}
      </body>
    </html>
  );
}
