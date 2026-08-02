import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const viewport: Viewport = {
  themeColor: "#CC1F2B",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | CCFO26",
    default: "CCFO26 | Coupe Cantonale Fieng Okano 2026",
  },
  description: "Plateforme officielle de la Coupe Cantonale Fieng Okano 2026. Suivez les résultats en direct, le classement et inscrivez votre équipe.",
  keywords: ["CCFO26", "CCFO", "Coupe Cantonale", "Fieng Okano", "Football Amateur", "Tournoi", "Gabon", "2026"],
  authors: [{ name: "CCFO26" }],
  creator: "CCFO26",
  publisher: "CCFO26",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "CCFO26 — Coupe Cantonale Fieng Okano 2026",
    description: "Vivez l'excellence du football au cœur du canton Fieng Okano. L'élite s'affronte, l'histoire s'écrit ici.",
    url: SITE_URL,
    siteName: "CCFO26",
    images: [
      {
        url: "/image-1.jpg",
        width: 1200,
        height: 630,
        alt: "CCFO26 Stadium Atmosphere",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CCFO26 — Coupe Cantonale Fieng Okano 2026",
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

import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>  
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ccfo-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-color-scheme',t)}catch(e){}`,
          }}
        />
      </head>
      <body
        className={cn(
          inter.variable,
          outfit.variable,
          "font-inter bg-background text-foreground min-h-dvh"
        )}
      >
        {children}
        <PWAInstallPrompt />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
