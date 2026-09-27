export type { AuthClient, ProviderTokens } from "./types";
export { SupabaseAuthClient } from "./supabaseAuthClient";

import { SupabaseAuthClient } from "./supabaseAuthClient";
import type { AuthClient } from "./types";

/** The app-wide instance. Everything outside `shared/auth/` depends on the `AuthClient` type,
 * not on this singleton's concrete class — swap this one line to change identity engines. */
export const authClient: AuthClient = new SupabaseAuthClient();
