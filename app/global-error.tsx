"use client";

// Dernier filet de sécurité : se déclenche uniquement si le layout racine
// lui-même plante. Doit définir son propre <html>/<body> et ne peut pas
// dépendre du reste de l'app (styles en ligne volontairement).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fffdfd",
          color: "#0A0A0A",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 420 }}>
          <div
            style={{
              width: 56, height: 56, borderRadius: 16, margin: "0 auto 1rem",
              background: "rgba(204, 31, 43, 0.1)", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 28,
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
            Une erreur critique est survenue
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#888888", marginBottom: "1.5rem", lineHeight: 1.5 }}>
            L&apos;application n&apos;a pas pu se charger. Réessayez dans quelques instants.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.75rem", borderRadius: 9999, background: "#CC1F2B",
              color: "#fff", fontWeight: 700, fontSize: "0.875rem", border: "none", cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
