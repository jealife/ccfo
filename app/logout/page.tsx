"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function handleLogout() {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    }
    handleLogout();
  }, [supabase, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-black font-outfit uppercase tracking-tighter">Déconnexion en cours</h1>
        <p className="text-muted text-sm">Merci de votre visite, à bientôt !</p>
      </div>
    </div>
  );
}
