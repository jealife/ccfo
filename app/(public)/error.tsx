"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Cette page a rencontré un problème"
      message="Une erreur inattendue est survenue. Réessayez ou revenez à l'accueil."
      backHref="/"
      backLabel="Accueil"
    />
  );
}
