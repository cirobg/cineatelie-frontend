/** Reachable on `402 subscription_inactive` (frontend spec §8). Billing itself is `modules/
 * billing` (M2) -- this is only the routing target so a lapsed tenant has somewhere to land;
 * the actual renewal flow is built alongside `/billing/*`. */
export function SubscriptionBlockedPage() {
  return (
    <div>
      <h1>Assinatura inativa</h1>
      <p>A assinatura deste workspace está inativa. Entre em contato para renovar o acesso.</p>
    </div>
  );
}
