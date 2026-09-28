import { describe, it, expect } from "vitest";
import {
  toBigIntPaisa,
  fromBigIntPaisa,
  addBdt,
  subtractBdt,
  applyPct,
  calculatePlatformFee,
  calculateNetReturn,
  isValidBdtAmount,
  assertPositiveBdt,
  roundBdt,
  PLATFORM_FEE_PCT,
} from "@/lib/financial/money";

describe("toBigIntPaisa", () => {
  it("converts whole BDT to paisa", () => {
    expect(toBigIntPaisa(1000)).toBe(100000n);
  });
  it("converts decimal BDT to paisa", () => {
    expect(toBigIntPaisa(1000.50)).toBe(100050n);
  });
  it("converts string BDT to paisa", () => {
    expect(toBigIntPaisa("500.75")).toBe(50075n);
  });
  it("handles zero", () => {
    expect(toBigIntPaisa(0)).toBe(0n);
  });
  it("handles single decimal place", () => {
    expect(toBigIntPaisa(10.5)).toBe(1050n);
  });
});

describe("fromBigIntPaisa", () => {
  it("converts paisa to BDT", () => {
    expect(fromBigIntPaisa(100050n)).toBe(1000.50);
  });
  it("converts zero", () => {
    expect(fromBigIntPaisa(0n)).toBe(0);
  });
  it("handles negative paisa", () => {
    expect(fromBigIntPaisa(-100n)).toBe(-1);
  });
  it("round-trips correctly", () => {
    const original = 12345.67;
    expect(fromBigIntPaisa(toBigIntPaisa(original))).toBe(original);
  });
});

describe("addBdt", () => {
  it("adds two amounts correctly", () => {
    expect(addBdt(100.50, 200.25)).toBe(300.75);
  });
  it("avoids floating-point errors", () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS — must be 0.30
    expect(addBdt(0.1, 0.2)).toBe(0.30);
  });
  it("handles large amounts", () => {
    expect(addBdt(999999.99, 0.01)).toBe(1000000.00);
  });
  it("adds zero correctly", () => {
    expect(addBdt(500, 0)).toBe(500);
  });
});

describe("subtractBdt", () => {
  it("subtracts two amounts correctly", () => {
    expect(subtractBdt(300.75, 100.50)).toBe(200.25);
  });
  it("avoids floating-point errors", () => {
    expect(subtractBdt(0.3, 0.1)).toBe(0.20);
  });
  it("returns negative when b > a", () => {
    expect(subtractBdt(100, 150)).toBe(-50);
  });
  it("subtracts zero correctly", () => {
    expect(subtractBdt(500, 0)).toBe(500);
  });
});

describe("applyPct", () => {
  it("calculates 15% of 10000", () => {
    expect(applyPct(10000, 15)).toBe(1500);
  });
  it("calculates 12.5% of 50000", () => {
    expect(applyPct(50000, 12.5)).toBe(6250);
  });
  it("calculates 10% of 7777", () => {
    expect(applyPct(7777, 10)).toBe(777.7);
  });
  it("calculates 2.5% of 1000", () => {
    expect(applyPct(1000, 2.5)).toBe(25);
  });
  it("handles 0%", () => {
    expect(applyPct(10000, 0)).toBe(0);
  });
  it("handles 100%", () => {
    expect(applyPct(10000, 100)).toBe(10000);
  });
});

describe("calculatePlatformFee", () => {
  it(`charges ${PLATFORM_FEE_PCT}% on return`, () => {
    expect(calculatePlatformFee(1000)).toBe(applyPct(1000, PLATFORM_FEE_PCT));
  });
  it("fee on 2000 return", () => {
    expect(calculatePlatformFee(2000)).toBe(50); // 2.5% of 2000
  });
});

describe("calculateNetReturn", () => {
  it("returns gross, fee, and net", () => {
    const result = calculateNetReturn(1000);
    expect(result.gross).toBe(1000);
    expect(result.fee).toBe(25);   // 2.5%
    expect(result.net).toBe(975);
  });
  it("gross = fee + net", () => {
    const { gross, fee, net } = calculateNetReturn(5000);
    expect(addBdt(fee, net)).toBe(gross);
  });
  it("handles fractional amounts", () => {
    const { gross, fee, net } = calculateNetReturn(333.33);
    expect(addBdt(fee, net)).toBe(gross);
  });
});

describe("isValidBdtAmount", () => {
  it("accepts valid amounts", () => {
    expect(isValidBdtAmount(1000)).toBe(true);
    expect(isValidBdtAmount(1000.50)).toBe(true);
    expect(isValidBdtAmount(0.01)).toBe(true);
    expect(isValidBdtAmount(0)).toBe(true);
  });
  it("rejects more than 2 decimal places", () => {
    expect(isValidBdtAmount(1000.001)).toBe(false);
    expect(isValidBdtAmount(0.123)).toBe(false);
  });
  it("rejects negative amounts", () => {
    expect(isValidBdtAmount(-1)).toBe(false);
  });
  it("rejects NaN and Infinity", () => {
    expect(isValidBdtAmount(NaN)).toBe(false);
    expect(isValidBdtAmount(Infinity)).toBe(false);
  });
});

describe("assertPositiveBdt", () => {
  it("does not throw for valid positive amount", () => {
    expect(() => assertPositiveBdt(100)).not.toThrow();
    expect(() => assertPositiveBdt(0.01)).not.toThrow();
  });
  it("throws for zero", () => {
    expect(() => assertPositiveBdt(0)).toThrow();
  });
  it("throws for negative", () => {
    expect(() => assertPositiveBdt(-1)).toThrow();
  });
  it("throws for NaN", () => {
    expect(() => assertPositiveBdt(NaN)).toThrow();
  });
  it("throws for more than 2 decimal places", () => {
    expect(() => assertPositiveBdt(1.001)).toThrow();
  });
  it("includes label in error message", () => {
    expect(() => assertPositiveBdt(-5, "Deposit")).toThrow(/Deposit/);
  });
});

describe("roundBdt", () => {
  it("rounds to 2 decimal places", () => {
    expect(roundBdt(1.006)).toBe(1.01);
    expect(roundBdt(1.004)).toBe(1.00);
    expect(roundBdt(100)).toBe(100);
  });
});
