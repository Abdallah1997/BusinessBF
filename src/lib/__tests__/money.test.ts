import { describe, expect, it } from "vitest";
import { centsToInputValue, formatCents, parseDollarsToCents } from "../money";

describe("formatCents", () => {
  it("formats positive amounts", () => {
    expect(formatCents(123456)).toBe("$1,234.56");
    expect(formatCents(5)).toBe("$0.05");
    expect(formatCents(0)).toBe("$0.00");
  });

  it("formats negative amounts", () => {
    expect(formatCents(-2243)).toBe("-$22.43");
  });
});

describe("parseDollarsToCents", () => {
  it("parses plain dollars", () => {
    expect(parseDollarsToCents("12")).toBe(1200);
    expect(parseDollarsToCents("12.5")).toBe(1250);
    expect(parseDollarsToCents("12.50")).toBe(1250);
  });

  it("parses $ and comma formatting", () => {
    expect(parseDollarsToCents("$1,234.56")).toBe(123456);
  });

  it("parses negatives", () => {
    expect(parseDollarsToCents("-3.25")).toBe(-325);
  });

  it("rejects garbage and float-trap inputs", () => {
    expect(parseDollarsToCents("abc")).toBeNull();
    expect(parseDollarsToCents("12.345")).toBeNull();
    expect(parseDollarsToCents("1e5")).toBeNull();
    expect(parseDollarsToCents("")).toBeNull();
    expect(parseDollarsToCents("12.")).toBeNull();
  });

  it("round-trips with centsToInputValue", () => {
    expect(parseDollarsToCents(centsToInputValue(1250))).toBe(1250);
    expect(centsToInputValue(1250)).toBe("12.50");
  });
});
