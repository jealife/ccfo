"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  error?: (Error & { digest?: string }) | null;
  reset?: () => void;
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}

/** Écran d'erreur générique, réutilisé par les error.tsx de chaque zone de l'app. */
export function ErrorState({
  error,
  reset,
  title = "Une erreur est survenue",
  message = "Quelque chose s'est mal passé. Vous pouvez réessayer ou revenir en arrière.",
  backHref,
  backLabel = "Accueil",
}: ErrorStateProps) {
  useEffect(() => {
    if (error) console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="glass-card p-8 md:p-10 max-w-md w-full text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black font-outfit uppercase tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted">{message}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {reset && (
            <button type="button" onClick={reset} className="btn-primary w-full sm:w-auto">
              <RotateCcw className="w-4 h-4" /> Réessayer
            </button>
          )}
          {backHref && (
            <Link
              href={backHref}
              className="w-full sm:w-auto text-center px-6 py-3 rounded-full border border-border text-sm font-bold text-foreground hover:border-primary/40 hover:text-primary transition-all"
            >
              {backLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
