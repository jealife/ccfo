import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";
import { isRegistrationOpen } from "@/lib/registration";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const open = await isRegistrationOpen();

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour à l’accueil
        </Link>

        {open ? (
          <RegisterForm />
        ) : (
          <div className="sports-card p-8 bg-card/50 backdrop-blur-xl border-white/5 space-y-4 text-center">
            <Lock className="w-8 h-8 text-muted mx-auto" />
            <h1 className="text-2xl font-black font-outfit uppercase tracking-tight">Inscriptions Fermées</h1>
            <p className="text-muted text-sm">
              Les inscriptions sont actuellement closes. Contactez l’administration pour plus d’informations.
            </p>
            <p className="text-sm pt-2">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
