"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the BeforeInstallPromptEvent type globally or locally
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone);
    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show our custom prompt immediately since the user requested to see it on open
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-card/90 backdrop-blur-xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-full duration-500 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <Download className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Installez l'application CCFO26</h3>
          <p className="text-xs text-muted">Ajoutez-nous à votre écran d'accueil pour un accès rapide et hors ligne.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button 
          onClick={handleDismiss}
          className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-widest transition-colors"
        >
          Plus tard
        </button>
        <button 
          onClick={handleInstallClick}
          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          Installer
        </button>
        <button onClick={handleDismiss} className="p-2 sm:hidden absolute top-2 right-2 text-muted hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
