import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { authClient } from "../../shared/auth";
import { apiFetch } from "../../shared/lib/httpClient";
import { useSessionStore } from "../../shared/auth/session";
import type { ExchangeResponse, PermissionsResponse } from "../../shared/lib/apiTypes";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  // React 18 StrictMode double-invokes effects in dev without resetting refs, so this ref
  // guard stops the callback from being processed twice.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        const providerTokens = await authClient.handleCallback();
        const exchange = await apiFetch<ExchangeResponse>("/auth/exchange", {
          method: "POST",
          body: JSON.stringify({
            access_token: providerTokens.accessToken,
            refresh_token: providerTokens.refreshToken,
          }),
          skipTenantHeader: true,
        });
        useSessionStore.getState().setSession({ accessToken: exchange.access_token, me: exchange });
        if (useSessionStore.getState().activeTenant) {
          const { permissions } = await apiFetch<PermissionsResponse>("/me/permissions");
          useSessionStore.getState().setPermissions(permissions);
        }
        navigate("/", { replace: true });
      } catch (caught) {
        console.error("OAuth callback failed:", caught);
        setError("Não foi possível concluir o login. Tente novamente.");
      }
    })();
  }, [navigate]);

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <a href="/login">Voltar ao login</a>
      </div>
    );
  }
  return <p>Entrando…</p>;
}
