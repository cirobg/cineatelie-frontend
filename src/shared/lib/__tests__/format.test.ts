import { describe, expect, it } from "vitest";
import {
  formatCurrencyBRL,
  formatDateBR,
  formatDateTimeBR,
  formatOrDash,
  formatPercentage,
  formatPhone,
  formatQuantity,
  formatRelativeDeadline,
  formatTimeBR,
  maskCPF,
  parseDecimalBR,
} from "../format";

describe("formatCurrencyBRL", () => {
  it("formats the spec's own example", () => {
    expect(formatCurrencyBRL("1234.56")).toBe("R$ 1.234,56");
  });

  it("formats a plain number the same way", () => {
    expect(formatCurrencyBRL(1234.56)).toBe("R$ 1.234,56");
  });

  it("formats zero", () => {
    expect(formatCurrencyBRL("0.00")).toBe("R$ 0,00");
  });
});

describe("parseDecimalBR", () => {
  it("accepts a comma decimal", () => {
    expect(parseDecimalBR("7,5")).toBe("7.5");
  });

  it("accepts a dot decimal unchanged", () => {
    expect(parseDecimalBR("7.5")).toBe("7.5");
  });

  it("treats a grouped comma-decimal amount correctly", () => {
    expect(parseDecimalBR("1.234,56")).toBe("1234.56");
  });

  it("treats a grouped dot-decimal amount correctly", () => {
    expect(parseDecimalBR("1,234.56")).toBe("1234.56");
  });

  it("passes through a bare integer", () => {
    expect(parseDecimalBR("7")).toBe("7");
  });

  it("rejects an empty string", () => {
    expect(() => parseDecimalBR("")).toThrow();
  });

  it("rejects garbage", () => {
    expect(() => parseDecimalBR("abc")).toThrow();
  });

  it("trims surrounding whitespace", () => {
    expect(parseDecimalBR("  7,5  ")).toBe("7.5");
  });
});

describe("formatQuantity", () => {
  it("trims trailing zeros — the spec's own example", () => {
    expect(formatQuantity(7.5)).toBe("7,5");
  });

  it("keeps a whole number with no decimal point", () => {
    expect(formatQuantity(7)).toBe("7");
  });

  it("keeps up to three significant decimals", () => {
    expect(formatQuantity(7.503)).toBe("7,503");
  });

  it("formats zero as a bare zero", () => {
    expect(formatQuantity(0)).toBe("0");
  });
});

describe("formatPercentage", () => {
  it("trims to a whole percentage — the spec's own example", () => {
    expect(formatPercentage(20)).toBe("20%");
  });

  it("keeps a card-fee-style two-decimal value — the spec's own example", () => {
    expect(formatPercentage(6.12)).toBe("6,12%");
  });
});

describe("formatDateBR", () => {
  it("formats an ISO business date as DD/MM/YYYY", () => {
    expect(formatDateBR("2026-01-31")).toBe("31/01/2026");
  });

  it("never shifts a day backward regardless of the host's local timezone", () => {
    // The classic bug: new Date("2026-01-31") is parsed as UTC midnight, then formatted in
    // a negative-offset timezone, silently becoming 30/01/2026.
    expect(formatDateBR("2026-01-01")).toBe("01/01/2026");
  });
});

describe("formatTimeBR", () => {
  it("formats a Postgres TIME-shaped string", () => {
    expect(formatTimeBR("08:00:00")).toBe("08:00");
  });

  it("formats a bare HH:MM string", () => {
    expect(formatTimeBR("18:30")).toBe("18:30");
  });

  it("formats a Date instant", () => {
    expect(formatTimeBR(new Date(2026, 0, 1, 9, 5))).toBe("09:05");
  });

  it("rejects an unrecognisable string", () => {
    expect(() => formatTimeBR("not a time")).toThrow();
  });
});

describe("formatDateTimeBR", () => {
  it("formats an ISO instant in the given timezone", () => {
    // 12:00 UTC is 09:00 in America/Sao_Paulo (UTC-3, no DST since 2019).
    expect(formatDateTimeBR("2026-06-15T12:00:00Z", "America/Sao_Paulo")).toBe(
      "15/06/2026 09:00",
    );
  });
});

describe("formatRelativeDeadline", () => {
  const today = new Date(2026, 5, 15); // 15 June 2026, local midnight

  it("says 'hoje' for today", () => {
    expect(formatRelativeDeadline("2026-06-15", today)).toBe("hoje");
  });

  it("counts days ahead, singular", () => {
    expect(formatRelativeDeadline("2026-06-16", today)).toBe("1 dia");
  });

  it("counts days ahead, plural", () => {
    expect(formatRelativeDeadline("2026-06-18", today)).toBe("3 dias");
  });

  it("reports an overdue date", () => {
    expect(formatRelativeDeadline("2026-06-13", today)).toBe("atrasado há 2 dias");
  });
});

describe("formatPhone", () => {
  it("formats an 11-digit mobile number", () => {
    expect(formatPhone("61999999999")).toBe("(61) 99999-9999");
  });

  it("formats a 10-digit landline number", () => {
    expect(formatPhone("6133334444")).toBe("(61) 3333-4444");
  });

  it("ignores existing punctuation in the input", () => {
    expect(formatPhone("(61) 99999-9999")).toBe("(61) 99999-9999");
  });

  it("returns an unrecognisable shape unchanged", () => {
    expect(formatPhone("123")).toBe("123");
  });
});

describe("maskCPF", () => {
  it("assembles the mask from the last three digits", () => {
    expect(maskCPF("123")).toBe("***.***.123-**");
  });
});

describe("formatOrDash", () => {
  it("returns an em dash for null", () => {
    expect(formatOrDash(null)).toBe("—");
  });

  it("returns an em dash for undefined", () => {
    expect(formatOrDash(undefined)).toBe("—");
  });

  it("returns an em dash for an empty string", () => {
    expect(formatOrDash("")).toBe("—");
  });

  it("passes a real value through", () => {
    expect(formatOrDash("Mariana")).toBe("Mariana");
  });
});
