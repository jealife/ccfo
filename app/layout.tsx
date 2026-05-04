import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | Coupe Cantonale Fieng Okano",
    default: "CCFO | Coupe Cantonale Fieng Okano - Tournoi de Football Amateur",
  },
  description: "Le système de gestion numérique officiel de la Coupe Cantonale Fieng Okano (CCFO). Suivez les résultats en direct, le classement des équipes et inscrivez votre village pour le tournoi de football amateur.",
  keywords: ["CCFO", "Coupe Cantonale", "Fieng Okano", "Football Amateur", "Tournoi", "Gabon", "Sport", "Gestion Sportive"],
  authors: [{ name: "CCFO Admin" }],
  creator: "CCFO",
  publisher: "CCFO",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Coupe Cantonale Fieng Okano (CCFO)",
    description: "Vivez l'excellence du football au cœur du canton Fieng Okano. L'élite s'affronte, l'histoire s'écrit ici.",
    url: "https://ccfo.vercel.app",
    siteName: "CCFO",
    images: [
      {
        url: "/image-1.jpg",
        width: 1200,
        height: 630,
        alt: "CCFO Stadium Atmosphere",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coupe Cantonale Fieng Okano (CCFO)",
    description: "Vivez l'excellence du football au cœur du canton Fieng Okano.",
    images: ["/image-1.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
