/**
 * The only sanctioned way to render these types (frontend spec §6): "hand-rolled formatting
 * is a review failure." Every one of these has a spec-given example this file is tested
 * against, verbatim.
 *
 * Deliberately absent: a function that assembles a document's display number
 * (`"ORC-0025"`). `display_number` always comes from the API and is never assembled
 * client-side (§6) — that rule belongs here as its absence, not as a function nobody
 * should call.
 */

import { format as formatDateFns } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

/** `VITE_DEFAULT_TIMEZONE` — not a user setting in phase 1 (architecture doc Appendix A).
 * `formatDateTimeBR` takes an explicit zone parameter defaulting to this, so wiring a real
 * per-tenant timezone later is additive, not a redesign. */
export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

// --- money ---------------------------------------------------------------------------

/** `"1234.56"` (the API's decimal-string wire format, ADR-008) -> `"R$ 1.234,56"`. */
export function formatCurrencyBRL(value: number | string): string {
  const amount = typeof value === "string" ? Number(value) : value;
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
  // Intl renders a non-breaking space (U+00A0) between "R$" and the number; normalise to
  // a regular space so string equality elsewhere in the app isn't tripped by an invisible
  // character the spec's literal "R$ 1.234,56" doesn't show.
  return formatted.replace(/ /g, " ");
}

/**
 * `","` or `"."` accepted; normalises to the API's `.`-decimal wire string (ADR-008).
 * When both separators are present, whichever comes last is the decimal point and the
 * other is treated as a thousands grouping separator and stripped — so `"1.234,56"` and
 * `"1,234.56"` both normalise correctly. With only one separator present (the common case:
 * a bare `"7,5"` or `"7.5"` typed into a quantity field), that separator is always the
 * decimal point.
 *
 * Throws on anything that isn't a recognisable decimal after normalising.
 */
export function parseDecimalBR(input: string): string {
  const trimmed = input.trim();
  if (trimmed === "") {
    throw new Error("empty decimal input");
  }

  const hasComma = trimmed.includes(",");
  const hasDot = trimmed.includes(".");

  let normalized: string;
  if (hasComma && hasDot) {
    const decimalIsComma = trimmed.lastIndexOf(",") > trimmed.lastIndexOf(".");
    normalized = decimalIsComma
      ? trimmed.replace(/\./g, "").replace(",", ".")
      : trimmed.replace(/,/g, "");
  } else if (hasComma) {
    normalized = trimmed.replace(",", ".");
  } else {
    normalized = trimmed;
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`not a valid decimal: ${input}`);
  }

  return normalized;
}

/** Up to 3 decimals, trailing zeros trimmed: `formatQuantity(7.5)` -> `"7,5"`, not `"7,500"`. */
export function formatQuantity(value: number | string): string {
  const amount = typeof value === "string" ? Number(value) : value;
  const trimmed = amount.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  return trimmed.replace(".", ",");
}

/** `formatPercentage(6.12)` -> `"6,12%"`; `formatPercentage(20)` -> `"20%"`. */
export function formatPercentage(value: number | string): string {
  const amount = typeof value === "string" ? Number(value) : value;
  const trimmed = amount.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return `${trimmed.replace(".", ",")}%`;
}

// --- dates and times -------------------------------------------------------------------

/** A bare `"YYYY-MM-DD"` business date (ADR-014) parsed as local midnight, never UTC — the
 * classic bug where a negative UTC offset (Brazil's) shifts the displayed day back by one. */
function parseBusinessDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

/** `"YYYY-MM-DD"` -> `"DD/MM/YYYY"`. */
export function formatDateBR(value: string): string {
  return formatDateFns(parseBusinessDate(value), "dd/MM/yyyy");
}

/** A `"HH:MM"` / `"HH:MM:SS"` string (e.g. a Postgres `TIME` column) or a `Date` instant
 * -> `"HH:mm"`, 24-hour. */
export function formatTimeBR(value: string | Date): string {
  if (value instanceof Date) {
    return formatDateFns(value, "HH:mm");
  }
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) {
    throw new Error(`not a recognisable time: ${value}`);
  }
  return `${match[1]}:${match[2]}`;
}

/** An ISO instant (RFC 3339 UTC, ADR-014) -> `"DD/MM/YYYY HH:mm"` in `timezone`, which
 * defaults to `DEFAULT_TIMEZONE` since there is no per-tenant override yet. */
export function formatDateTimeBR(value: string | Date, timezone: string = DEFAULT_TIMEZONE): string {
  return formatInTimeZone(value, timezone, "dd/MM/yyyy HH:mm");
}

/** `"3 dias"`, `"hoje"`, `"atrasado há 2 dias"` — days between today and a business date. */
export function formatRelativeDeadline(targetDate: string, referenceDate: Date = new Date()): string {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const target = parseBusinessDate(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return "hoje";
  if (diffDays > 0) return `${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;

  const overdueDays = Math.abs(diffDays);
  return `atrasado há ${overdueDays} ${overdueDays === 1 ? "dia" : "dias"}`;
}

// --- contact and identity ---------------------------------------------------------------

/** Digits only, 10 or 11 of them -> `"(61) 99999-9999"` (mobile) or `"(61) 3333-4444"`
 * (landline). Anything else is returned unchanged rather than mangled. */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value;
}

/**
 * `maskCPF("123")` -> `"***.***.123-**"`. Takes `cpf_last3` (database spec, ADR-013) —
 * the API never sends a decrypted CPF unless the user explicitly reveals it (BR-CLI-03),
 * so this never has the full number to mask in the first place.
 */
export function maskCPF(last3: string): string {
  return `***.***.${last3}-**`;
}

// --- fallback -----------------------------------------------------------------------

/** An em dash, never a blank cell or the literal word "null". */
export function formatOrDash(value: string | null | undefined): string {
  return value === null || value === undefined || value === "" ? "—" : value;
}
