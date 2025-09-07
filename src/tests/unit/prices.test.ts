// Import necessary Vitest functions and the function to test
import { describe, it, expect, vi, beforeEach } from "vitest";
import { dedupeCheapestVariants, type Item } from "@/lib/prices/prices";

// Mock server-only module
vi.mock("server-only", () => {
  return {};
});

// Clear mocks before each test for isolation
beforeEach(() => {
  vi.clearAllMocks();
});

describe("dedupeCheapestVariants", () => {
  describe("Basic Cases", () => {
    it("returns empty array for empty input", () => {
      const input: Item[] = [];
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([]);
      expect(output.length).toBe(0);
    });

    it("handles single item unchanged", () => {
      const singleItem: Item = {
        type: "UniqueWeapon",
        name: "Single Item",
        chaos: 10,
        baseType: "Cool Type",
        icon: "http://example.com/icon.png",
        listingCount: 5,
        detailsId: "single-item-cool-type",
      };
      const input: Item[] = [singleItem];
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([singleItem]);
      expect(output.length).toBe(1);
      expect(new Set(output.map((item) => item.name)).size).toBe(1);
    });

    it("passes through array with no duplicates unchanged", () => {
      const items: Item[] = [
        {
          type: "UniqueWeapon",
          name: "Unique Item One",
          chaos: 10,
          baseType: "Cool Type One",
          icon: "http://example.com/icon1.png",
          listingCount: 5,
          detailsId: "unique-item-one-cool-type-one",
        },
        {
          type: "UniqueArmour",
          name: "Unique Item Two",
          chaos: 20,
          baseType: "Cool Type Two",
          icon: "http://example.com/icon2.png",
          listingCount: 3,
          detailsId: "unique-item-two-cool-type-two",
        },
      ];
      const output = dedupeCheapestVariants(items);
      expect(output).toEqual(items);
      expect(output.length).toBe(2);
      expect(new Set(output.map((item) => item.name)).size).toBe(2);
    });
  });

  describe("Duplication Handling", () => {
    it("dedupes non-special duplicates to cheapest with summed listingCount", () => {
      const baseItem: Omit<Item, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Duplicate Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "duplicate-item-cool-base",
      };
      const item1: Item = { ...baseItem, chaos: 15, listingCount: 2 };
      const item2: Item = { ...baseItem, chaos: 10, listingCount: 3 }; // Cheaper
      const input: Item[] = [item1, item2];
      const expected: Item = { ...item2, listingCount: 5 }; // Sum counts, cheapest fields
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output.length).toBe(1);
      expect(output[0].chaos).toBe(10);
      expect(output[0].listingCount).toBe(5);
      expect(new Set(output.map((item) => item.name)).size).toBe(1);
    });

    it("handles tied cheapest prices by keeping first occurrence", () => {
      const baseItem: Omit<Item, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Tie Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "tie-item-cool-base",
      };
      const item1: Item = { ...baseItem, chaos: 10, listingCount: 2 };
      const item2: Item = {
        ...baseItem,
        chaos: 10,
        listingCount: 3,
        detailsId: "tie-item-cool-base-variant",
      }; // Same price, different id
      const input: Item[] = [item1, item2];
      const expected: Item = { ...item1, listingCount: 5 }; // Keeps first's detailsId
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output[0].detailsId).toBe("tie-item-cool-base"); // First occurrence
      expect(output[0].listingCount).toBe(5);
    });

    it("dedupes only special duplicates to cheapest special", () => {
      const baseItem: Omit<Item, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Special Item",
        baseType: "Cool Relic",
        icon: "http://example.com/icon.png",
        detailsId: "special-item-cool-relic",
      };
      const item1: Item = { ...baseItem, chaos: 15, listingCount: 2 };
      const item2: Item = {
        ...baseItem,
        chaos: 10,
        listingCount: 3,
        detailsId: "special-item-cool-relic-5l",
      }; // Another special
      const input: Item[] = [item1, item2];
      const expected: Item = { ...item2, listingCount: 3 }; // Cheapest's count, no sum since all special
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output[0].chaos).toBe(10);
      expect(output[0].listingCount).toBe(3);
    });

    it("prefers non-special over special when mixed in group", () => {
      const baseItem: Omit<Item, "chaos" | "listingCount" | "detailsId"> = {
        type: "UniqueWeapon",
        name: "Mixed Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
      };
      const nonSpecial: Item = {
        ...baseItem,
        chaos: 12,
        listingCount: 4,
        detailsId: "mixed-item-cool-base",
      };
      const special: Item = {
        ...baseItem,
        chaos: 8,
        listingCount: 2,
        detailsId: "mixed-item-cool-base-relic",
      }; // Cheaper but special
      const input: Item[] = [nonSpecial, special];
      const expected: Item = { ...nonSpecial, listingCount: 4 }; // Prefers non-special, even if more expensive
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output[0].chaos).toBe(12);
      expect(output[0].listingCount).toBe(4);
    });

    it("sums listingCount for all non-special even if multiple with different prices", () => {
      const baseItem: Omit<Item, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Multi Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "multi-item-cool-base",
      };
      const item1: Item = { ...baseItem, chaos: 15, listingCount: 2 };
      const item2: Item = { ...baseItem, chaos: 10, listingCount: 3 }; // Cheapest
      const item3: Item = { ...baseItem, chaos: 12, listingCount: 1 };
      const input: Item[] = [item1, item2, item3];
      const expected: Item = { ...item2, listingCount: 6 }; // Sum all non-special: 2+3+1
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output[0].listingCount).toBe(6);
    });
  });

  describe("Error-Prone Inputs", () => {
    it("throws on null input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => dedupeCheapestVariants(null as any)).toThrow();
    });

    it("throws on undefined input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => dedupeCheapestVariants(undefined as any)).toThrow();
    });

    it("throws on array with null items due to property access on null", () => {
      const validItem: Item = {
        type: "UniqueWeapon",
        name: "Valid Item",
        chaos: 10,
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        listingCount: 5,
        detailsId: "valid-item-cool-base",
      };
      const input: (Item | null)[] = [validItem, null];
      // Since null.name would throw, expect throw
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => dedupeCheapestVariants(input as any)).toThrow();
    });

    it("includes malformed items missing name in output, grouped under undefined name", () => {
      const malformed = {
        type: "UniqueWeapon" as const,
        chaos: 10,
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        listingCount: 5,
        detailsId: "malformed-item-cool-base",
      }; // No name
      const validItem: Item = { ...malformed, name: "Valid Malformed Item" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input: any[] = [malformed, validItem];
      // Grouping on undefined name: Map key undefined, but proceeds; output includes both (undefined group and valid)
      const output = dedupeCheapestVariants(input);
      expect(output.length).toBe(2);
      expect(output.some((item) => item.name === undefined)).toBe(true);
      expect(output.some((item) => item.name === "Valid Malformed Item")).toBe(
        true,
      );
    });

    it("handles malformed items with NaN chaos by treating as higher in reduce", () => {
      const baseItem: Omit<Item, "chaos"> = {
        type: "UniqueWeapon",
        name: "NaN Chaos Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        listingCount: 5,
        detailsId: "nan-chaos-item-cool-base",
      };
      const valid: Item = { ...baseItem, chaos: 10 };
      const nanChaos = { ...baseItem, chaos: NaN };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input: any[] = [valid, nanChaos];
      const output = dedupeCheapestVariants(input);
      expect(output.length).toBe(1);
      expect(output[0].chaos).toBe(10);
    });

    it("handles mixed types (non-Item objects) by grouping under undefined name", () => {
      const partialItem = {
        name: "Partial Item",
        chaos: 10,
        type: "UniqueWeapon" as const,
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        listingCount: 5,
        detailsId: "partial-item-cool-base",
      };
      const numberItem = 123; // Primitive, .name undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input: any[] = [partialItem, numberItem];
      const output = dedupeCheapestVariants(input);
      expect(output.length).toBe(2); // One for 'Partial Item', one for undefined (from number)
      expect(output.some((item) => item.name === "Partial Item")).toBe(true);
      expect(output.some((item) => item.name === undefined)).toBe(true);
    });
  });

  describe("Performance and Large Inputs", () => {
    it("handles large input arrays efficiently", () => {
      // Generate 100 groups, each with 100 duplicate items
      const baseItem: Omit<Item, "name" | "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "large-item-cool-base",
      };
      const input: Item[] = [];
      for (let group = 0; group < 100; group++) {
        const groupName = `Large Item ${group}`;
        for (let dup = 0; dup < 100; dup++) {
          input.push({
            ...baseItem,
            name: groupName,
            chaos: 10 + Math.random() * 10, // Vary slightly
            listingCount: 1,
          });
        }
      }
      const output = dedupeCheapestVariants(input);
      expect(output.length).toBe(100); // One per group
      expect(new Set(output.map((item) => item.name)).size).toBe(100);
      // Each should have summed listingCount ~100
      output.forEach((item) => expect(item.listingCount).toBe(100));
    });
  });

  describe("Additional Edge Cases", () => {
    it("does not treat as special if suffix not at end of detailsId", () => {
      const baseItem: Omit<Item, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Suffix Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "suffix-item-cool-base-relic-extra", // suffix not at end
      };
      const item1: Item = { ...baseItem, chaos: 15, listingCount: 2 };
      const item2: Item = { ...baseItem, chaos: 10, listingCount: 3 }; // Cheaper
      const input: Item[] = [item1, item2];
      const expected: Item = { ...item2, listingCount: 5 }; // Treated as non-special, sum counts
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output[0].chaos).toBe(10);
      expect(output[0].listingCount).toBe(5);
    });

    it("handles only-special group with all three suffixes: picks cheapest regardless of suffix type", () => {
      const baseItem: Omit<Item, "chaos" | "listingCount" | "detailsId"> = {
        type: "UniqueWeapon",
        name: "All Specials Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
      };
      const relic: Item = {
        ...baseItem,
        chaos: 15,
        listingCount: 2,
        detailsId: "all-specials-item-cool-base-relic",
      };
      const fiveL: Item = {
        ...baseItem,
        chaos: 10, // Cheapest
        listingCount: 3,
        detailsId: "all-specials-item-cool-base-5l",
      };
      const sixL: Item = {
        ...baseItem,
        chaos: 12,
        listingCount: 1,
        detailsId: "all-specials-item-cool-base-6l",
      };
      const input: Item[] = [relic, fiveL, sixL];
      const expected: Item = { ...fiveL, listingCount: 3 }; // Cheapest special's count, no sum
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output[0].chaos).toBe(10);
      expect(output[0].detailsId).toBe("all-specials-item-cool-base-5l");
      expect(output[0].listingCount).toBe(3);
    });

    it("handles mixed non-special + all three specials: prefers non-special, sums only non-specials", () => {
      const baseItem: Omit<Item, "chaos" | "listingCount" | "detailsId"> = {
        type: "UniqueWeapon",
        name: "Mixed All Specials Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
      };
      const nonSpecial1: Item = {
        ...baseItem,
        chaos: 20, // More expensive
        listingCount: 4,
        detailsId: "mixed-all-specials-item-cool-base",
      };
      const nonSpecial2: Item = {
        ...baseItem,
        chaos: 18, // Cheapest non-special
        listingCount: 2,
        detailsId: "mixed-all-specials-item-cool-base-variant",
      };
      const relic: Item = {
        ...baseItem,
        chaos: 15, // Cheaper but special
        listingCount: 1,
        detailsId: "mixed-all-specials-item-cool-base-relic",
      };
      const fiveL: Item = {
        ...baseItem,
        chaos: 12,
        listingCount: 3,
        detailsId: "mixed-all-specials-item-cool-base-5l",
      };
      const sixL: Item = {
        ...baseItem,
        chaos: 10,
        listingCount: 5,
        detailsId: "mixed-all-specials-item-cool-base-6l",
      };
      const input: Item[] = [nonSpecial1, nonSpecial2, relic, fiveL, sixL];
      const expected: Item = { ...nonSpecial2, listingCount: 6 }; // Cheapest non-special's details, sum non-special counts: 4+2
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output[0].chaos).toBe(18);
      expect(output[0].listingCount).toBe(6);
      expect(output[0].detailsId).toBe(
        "mixed-all-specials-item-cool-base-variant",
      );
    });

    it("handles zero chaos: treats as higher than positive, picks positive", () => {
      const baseItem: Omit<Item, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Zero Chaos Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "zero-chaos-item-cool-base",
      };
      const zeroChaos: Item = { ...baseItem, chaos: 0, listingCount: 2 };
      const positiveChaos: Item = { ...baseItem, chaos: 5, listingCount: 3 };
      const input: Item[] = [zeroChaos, positiveChaos];

      const output = dedupeCheapestVariants(input);
      expect(output[0].chaos).toBe(0); // Confirms 0 is treated as valid low
      expect(output[0].listingCount).toBe(5);
    });

    it("handles zero listingCount: includes in sum if non-special", () => {
      const baseItem: Omit<Item, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Zero Count Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "zero-count-item-cool-base",
      };
      const item1: Item = { ...baseItem, chaos: 10, listingCount: 0 };
      const item2: Item = { ...baseItem, chaos: 15, listingCount: 3 };
      const input: Item[] = [item1, item2];

      const output = dedupeCheapestVariants(input);
      expect(output[0].chaos).toBe(10);
      expect(output[0].listingCount).toBe(3);
    });

    it("does not treat as special if contains suffix but does not end with it", () => {
      const baseItem: Omit<Item, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Contains Suffix Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "contains-item-cool-base-with-relic-in-middle", // contains but not ends
      };
      const item1: Item = { ...baseItem, chaos: 15, listingCount: 2 };
      const item2: Item = { ...baseItem, chaos: 10, listingCount: 3 };
      const input: Item[] = [item1, item2];
      const expected: Item = { ...item2, listingCount: 5 }; // Non-special, sum
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output[0].listingCount).toBe(5);
    });
  });
});
