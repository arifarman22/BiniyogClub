import { describe, it, expect } from "vitest";
import { maskDobTyping } from "@/components/ui/dob-input";

/** Types `keys` one character at a time, like a user would. */
function type(keys: string, start = "") {
  let v = start;
  for (const k of keys) v = maskDobTyping(v + k, v);
  return v;
}

describe("maskDobTyping", () => {
  it("adds each slash as soon as the day and month are complete", () => {
    expect(type("1")).toBe("1");
    expect(type("15")).toBe("15/");
    expect(type("150")).toBe("15/0");
    expect(type("1508")).toBe("15/08/");
    expect(type("15081990")).toBe("15/08/1990");
  });

  it("pads a day that can only be one digit", () => {
    expect(type("4")).toBe("04/");
    expect(type("9")).toBe("09/");
    expect(type("3")).toBe("3"); // could still be 30 or 31
  });

  it("pads a month that can only be one digit", () => {
    expect(type("124")).toBe("12/04/");
    expect(type("121")).toBe("12/1"); // could still be 10–12
    expect(type("4419")).toBe("04/04/19");
  });

  it("ignores letters and stops at four year digits", () => {
    expect(type("1a2b")).toBe("12/");
    expect(type("1508199099")).toBe("15/08/1990");
  });

  it("leaves deletions alone so backspace works", () => {
    expect(maskDobTyping("15/0", "15/08")).toBe("15/0");
    expect(maskDobTyping("15", "15/")).toBe("15");
  });

  it("re-formats a pasted date", () => {
    expect(maskDobTyping("15081990", "")).toBe("15/08/1990");
    expect(maskDobTyping("15-08-1990", "")).toBe("15/08/1990");
  });
});
