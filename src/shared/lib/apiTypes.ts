/**
 * Hand-written to match `cineatelie-backend`'s `modules/identity/adapters/schemas.py`
 * exactly, field names included (snake_case, the real wire format — no transform layer to
 * hide a mismatch behind). Temporary: once `contract/openapi.json` is committed and codegen
 * wired up (deferred, see M1 status doc), these are replaced by the generated client's types.
 */

export interface TenantMembership {
  tenant_id: string;
  slug: string;
  trade_name: string;
  logo_url: string | null;
  role_code: string;
  is_default: boolean;
  plan_code: string | null;
  subscription_active: boolean;
}

export interface MePayload {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  locale: string;
  timezone: string;
  tenants: TenantMembership[];
}

export interface ExchangeResponse extends MePayload {
  access_token: string;
}

export interface RefreshResponse {
  access_token: string;
}

export interface PermissionsResponse {
  permissions: string[];
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details: unknown[];
  request_id: string | null;
}
