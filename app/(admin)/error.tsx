"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Erreur dans l'espace admin"
      message="Une erreur inattendue est survenue lors du chargement de cette page. Réessayez ou revenez au tableau de bord."
      backHref="/admin"
      backLabel="Tableau de bord"
    />
  );
}
