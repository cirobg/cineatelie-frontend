import { useState } from "react";
import { authClient } from "../../shared/auth";

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handleSignIn() {
    setError(null);
    setIsRedirecting(true);
    try {
      await authClient.signIn();
      // On success the browser navigates away to Google; nothing after this runs.
    } catch {
      setIsRedirecting(false);
      setError("Não foi possível iniciar o login. Tente novamente.");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "var(--space-9)",
        background: "var(--color-bg)",
      }}
    >
      <h1 style={{ fontFamily: "var(--font-script)", fontSize: "var(--font-size-1)", color: "var(--brand-blue-900)" }}>
        Cine Ateliê
      </h1>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isRedirecting}
        style={{
          padding: "var(--space-5) var(--space-9)",
          background: "var(--brand-carmim)",
          color: "var(--brand-cream)",
          border: "none",
          fontSize: "var(--font-size-4)",
          cursor: isRedirecting ? "default" : "pointer",
        }}
      >
        {isRedirecting ? "Redirecionando…" : "Entrar com Google"}
      </button>
      {error && <p style={{ color: "var(--brand-carmim)" }}>{error}</p>}
    </div>
  );
}
