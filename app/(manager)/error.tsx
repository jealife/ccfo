"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function ManagerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Erreur dans votre espace"
      message="Une erreur inattendue est survenue lors du chargement de cette page. Réessayez ou revenez à votre tableau de bord."
      backHref="/dashboard"
      backLabel="Mon espace"
    />
  );
}
