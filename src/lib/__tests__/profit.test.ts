import { describe, expect, it } from "vitest";
import { grossCents, marginFraction, profitCents, roiFraction } from "../profit";

const base = {
  salePriceCents: 4500,
  shippingChargedCents: 500,
  feesCents: 612,
  shippingCostCents: 845,
  otherCostCents: 50,
  costOfGoodsCents: 1250,
};

describe("profit math", () => {
  it("computes gross as sale price plus shipping charged", () => {
    expect(grossCents(base)).toBe(5000);
  });

  it("computes net profit subtracting fees, shipping, other, COGS", () => {
    // 5000 - 612 - 845 - 50 - 1250 = 2243
    expect(profitCents(base)).toBe(2243);
  });

  it("supports negative profit (a losing flip)", () => {
    expect(
      profitCents({ ...base, salePriceCents: 1000, shippingChargedCents: 0 }),
    ).toBe(1000 - 612 - 845 - 50 - 1250);
  });

  it("computes margin against gross", () => {
    expect(marginFraction(base)).toBeCloseTo(2243 / 5000);
  });

  it("margin is 0 when gross is 0", () => {
    expect(
      marginFraction({ ...base, salePriceCents: 0, shippingChargedCents: 0 }),
    ).toBe(0);
  });

  it("ROI relative to COGS; null when COGS is 0", () => {
    expect(roiFraction(base)).toBeCloseTo(2243 / 1250);
    expect(roiFraction({ ...base, costOfGoodsCents: 0 })).toBeNull();
  });
});
