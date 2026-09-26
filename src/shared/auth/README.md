The `AuthClient` seam (ADR-006, frontend spec §8): `signIn()`, `handleCallback()`,
`signOut()`, implemented by `SupabaseAuthClient` over `supabase-js`. No other file may
import `supabase-js` — enforced by an oxlint/ESLint `no-restricted-imports` rule added in
the same commit as this module, in M1.
