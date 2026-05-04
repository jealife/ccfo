"use client";

import { useState, useEffect } from "react";
import { Download, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Show the prompt after 5 seconds of being logged in/on dashboard
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);

      return () => clearTimeout(timer);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && deferredPrompt && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-200 lg:hidden"
        >
          <div className="bg-card border border-primary/30 p-6 rounded-xl shadow-2xl backdrop-blur-2xl bg-linear-to-br from-card to-background relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 text-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black font-outfit uppercase tracking-tight text-lg">Installer CCFO</h3>
                <p className="text-xs text-muted leading-relaxed">Ajoutez l'application sur votre écran d'accueil pour un accès rapide.</p>
              </div>
            </div>

            <button 
              onClick={handleInstall}
              className="w-full mt-6 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
            >
              <Download className="w-4 h-4" />
              Installer Maintenant
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
