import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="glass-card p-8 md:p-10 max-w-md w-full text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
          <SearchX className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black font-outfit uppercase tracking-tight text-foreground">Page introuvable</h1>
          <p className="text-sm text-muted">Cette page n&apos;existe pas ou a été déplacée.</p>
        </div>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-full bg-primary text-white font-bold text-sm hover:shadow-lg transition-all"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
