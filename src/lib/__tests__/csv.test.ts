import { describe, expect, it } from "vitest";
import { csvToObjects, escapeCsvField, parseCsv, toCsv } from "../csv";

describe("escapeCsvField", () => {
  it("quotes fields containing commas, quotes, newlines", () => {
    expect(escapeCsvField("plain")).toBe("plain");
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("parseCsv", () => {
  it("parses simple rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields with commas and escaped quotes", () => {
    expect(parseCsv('name,notes\n"Shirt, vintage","She said ""wow"""')).toEqual([
      ["name", "notes"],
      ["Shirt, vintage", 'She said "wow"'],
    ]);
  });

  it("handles CRLF and trailing newline", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles newlines inside quoted fields", () => {
    expect(parseCsv('a\n"line1\nline2"')).toEqual([["a"], ["line1\nline2"]]);
  });

  it("round-trips with toCsv", () => {
    const rows = [
      ["name", "cost"],
      ["Jacket, wool", "12.50"],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe("csvToObjects", () => {
  it("maps header row to object keys (lowercased)", () => {
    expect(csvToObjects("Name,Cost\nJacket,12.50")).toEqual([
      { name: "Jacket", cost: "12.50" },
    ]);
  });

  it("returns empty array without data rows", () => {
    expect(csvToObjects("name,cost")).toEqual([]);
    expect(csvToObjects("")).toEqual([]);
  });

  it("fills missing trailing fields with empty strings", () => {
    expect(csvToObjects("name,cost,sku\nJacket,12.50")).toEqual([
      { name: "Jacket", cost: "12.50", sku: "" },
    ]);
  });
});
