// Import necessary Vitest functions and the function to test
import type { InternalItem } from "@/lib/prices/prices";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dedupeCheapestVariants } from "@/lib/prices/prices";

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
      const input: InternalItem[] = [];
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([]);
      expect(output.length).toBe(0);
    });

    it("handles single item unchanged", () => {
      const singleItem: InternalItem = {
        type: "UniqueWeapon",
        name: "Single Item",
        chaos: 10,
        baseType: "Cool Type",
        icon: "http://example.com/icon.png",
        listingCount: 5,
        detailsId: "single-item-cool-type",
        itemType: "Weapon",
      };
      const input: InternalItem[] = [singleItem];
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([singleItem]);
      expect(output.length).toBe(1);
      expect(new Set(output.map((item) => item.name)).size).toBe(1);
    });

    it("passes through array with no duplicates unchanged", () => {
      const items: InternalItem[] = [
        {
          type: "UniqueWeapon",
          name: "Unique Item One",
          chaos: 10,
          baseType: "Cool Type One",
          icon: "http://example.com/icon1.png",
          listingCount: 5,
          detailsId: "unique-item-one-cool-type-one",
          itemType: "Weapon",
        },
        {
          type: "UniqueArmour",
          name: "Unique Item Two",
          chaos: 20,
          baseType: "Cool Type Two",
          icon: "http://example.com/icon2.png",
          listingCount: 3,
          detailsId: "unique-item-two-cool-type-two",
          itemType: "Armour",
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
      const baseItem: Omit<InternalItem, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Duplicate Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "duplicate-item-cool-base",
        itemType: "Weapon",
      };
      const item1: InternalItem = { ...baseItem, chaos: 15, listingCount: 2 };
      const item2: InternalItem = { ...baseItem, chaos: 10, listingCount: 3 }; // Cheaper
      const input: InternalItem[] = [item1, item2];
      const expected: InternalItem = { ...item2, listingCount: 5 }; // Sum counts, cheapest fields
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output.length).toBe(1);
      expect(output[0].chaos).toBe(10);
      expect(output[0].listingCount).toBe(5);
      expect(new Set(output.map((item) => item.name)).size).toBe(1);
    });

    it("handles tied cheapest prices by keeping first occurrence", () => {
      const baseItem: Omit<InternalItem, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Tie Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "tie-item-cool-base",
        itemType: "Weapon",
      };
      const item1: InternalItem = { ...baseItem, chaos: 10, listingCount: 2 };
      const item2: InternalItem = {
        ...baseItem,
        chaos: 10,
        listingCount: 3,
        detailsId: "tie-item-cool-base-variant",
      }; // Same price, different id
      const input: InternalItem[] = [item1, item2];
      const expected: InternalItem = { ...item1, listingCount: 5 }; // Keeps first's detailsId
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output[0].detailsId).toBe("tie-item-cool-base"); // First occurrence
      expect(output[0].listingCount).toBe(5);
    });

    it("dedupes only special duplicates to cheapest special", () => {
      const baseItem: Omit<InternalItem, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Special Item",
        baseType: "Cool Relic",
        icon: "http://example.com/icon.png",
        detailsId: "special-item-cool-relic",
        itemType: "Weapon",
      };
      const item1: InternalItem = { ...baseItem, chaos: 15, listingCount: 2 };
      const item2: InternalItem = {
        ...baseItem,
        chaos: 10,
        listingCount: 3,
        detailsId: "special-item-cool-relic-5l",
      }; // Another special
      const input: InternalItem[] = [item1, item2];
      const expected: InternalItem = { ...item2, listingCount: 3 }; // Cheapest item with its count
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
    });

    it("prefers non-special over special when mixed in group", () => {
      const baseItem: Omit<
        InternalItem,
        "chaos" | "listingCount" | "detailsId"
      > = {
        type: "UniqueWeapon",
        name: "Mixed Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        itemType: "Weapon",
      };
      const nonSpecial: InternalItem = {
        ...baseItem,
        chaos: 12,
        listingCount: 4,
        detailsId: "mixed-item-cool-base",
      };
      const special: InternalItem = {
        ...baseItem,
        chaos: 8,
        listingCount: 2,
        detailsId: "mixed-item-cool-base-relic",
      }; // Cheaper but special
      const input: InternalItem[] = [nonSpecial, special];
      const expected: InternalItem = { ...nonSpecial, listingCount: 4 }; // Prefers non-special, even if more expensive
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output[0].chaos).toBe(12);
      expect(output[0].listingCount).toBe(4);
    });

    it("sums listingCount for all non-special even if multiple with different prices", () => {
      const baseItem: Omit<InternalItem, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Multi Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "multi-item-cool-base",
        itemType: "Weapon",
      };
      const item1: InternalItem = { ...baseItem, chaos: 15, listingCount: 2 };
      const item2: InternalItem = { ...baseItem, chaos: 10, listingCount: 3 }; // Cheapest
      const item3: InternalItem = { ...baseItem, chaos: 12, listingCount: 1 };
      const input: InternalItem[] = [item1, item2, item3];
      const expected: InternalItem = { ...item2, listingCount: 6 }; // Sum all non-special: 2+3+1
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
      const validItem: InternalItem = {
        type: "UniqueWeapon",
        name: "Valid Item",
        chaos: 10,
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        listingCount: 5,
        detailsId: "valid-item-cool-base",
        itemType: "Weapon",
      };
      const input: (InternalItem | null)[] = [validItem, null];
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
        itemType: "Weapon",
      }; // No name
      const validItem: InternalItem = {
        ...malformed,
        name: "Valid Malformed Item",
      };
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
      const baseItem: Omit<InternalItem, "chaos"> = {
        type: "UniqueWeapon",
        name: "NaN Chaos Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        listingCount: 5,
        detailsId: "nan-chaos-item-cool-base",
        itemType: "Weapon",
      };
      const valid: InternalItem = { ...baseItem, chaos: 10 };
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
        itemType: "Weapon",
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
      const baseItem: Omit<InternalItem, "name" | "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "large-item-cool-base",
        itemType: "Weapon",
      };
      const input: InternalItem[] = [];
      for (let group = 0; group < 100; group++) {
        const groupName = `Large Item ${group}`;
        for (let dup = 0; dup < 100; dup++) {
          input.push({
            ...baseItem,
            name: groupName,
            chaos: 10 + (dup % 10), // Vary slightly
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
      const baseItem: Omit<InternalItem, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Suffix Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "suffix-item-cool-base-relic-extra", // suffix not at end
        itemType: "Weapon",
      };
      const item1: InternalItem = { ...baseItem, chaos: 15, listingCount: 2 };
      const item2: InternalItem = { ...baseItem, chaos: 10, listingCount: 3 }; // Cheaper
      const input: InternalItem[] = [item1, item2];
      const expected: InternalItem = { ...item2, listingCount: 5 }; // Treated as non-special, sum counts
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output[0].chaos).toBe(10);
      expect(output[0].listingCount).toBe(5);
    });

    it("handles only-special group with all three suffixes: picks cheapest regardless of suffix type", () => {
      const baseItem: Omit<
        InternalItem,
        "chaos" | "listingCount" | "detailsId"
      > = {
        type: "UniqueWeapon",
        name: "All Specials Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        itemType: "Weapon",
      };
      const relic: InternalItem = {
        ...baseItem,
        chaos: 15,
        listingCount: 2,
        detailsId: "all-specials-item-cool-base-relic",
      };
      const fiveL: InternalItem = {
        ...baseItem,
        chaos: 10, // Cheapest
        listingCount: 3,
        detailsId: "all-specials-item-cool-base-5l",
      };
      const sixL: InternalItem = {
        ...baseItem,
        chaos: 12,
        listingCount: 1,
        detailsId: "all-specials-item-cool-base-6l",
      };
      const input: InternalItem[] = [relic, fiveL, sixL];
      const expected: InternalItem = { ...fiveL, listingCount: 3 }; // Cheapest special's count, no sum
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output[0].chaos).toBe(10);
      expect(output[0].detailsId).toBe("all-specials-item-cool-base-5l");
    });

    it("handles mixed non-special + all three specials: prefers non-special, sums only non-specials", () => {
      const baseItem: Omit<
        InternalItem,
        "chaos" | "listingCount" | "detailsId"
      > = {
        type: "UniqueWeapon",
        name: "Mixed All Specials Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        itemType: "Weapon",
      };
      const nonSpecial1: InternalItem = {
        ...baseItem,
        chaos: 20, // More expensive
        listingCount: 4,
        detailsId: "mixed-all-specials-item-cool-base",
      };
      const nonSpecial2: InternalItem = {
        ...baseItem,
        chaos: 18, // Cheapest non-special
        listingCount: 2,
        detailsId: "mixed-all-specials-item-cool-base-variant",
      };
      const relic: InternalItem = {
        ...baseItem,
        chaos: 15, // Cheaper but special
        listingCount: 1,
        detailsId: "mixed-all-specials-item-cool-base-relic",
      };
      const fiveL: InternalItem = {
        ...baseItem,
        chaos: 12,
        listingCount: 3,
        detailsId: "mixed-all-specials-item-cool-base-5l",
      };
      const sixL: InternalItem = {
        ...baseItem,
        chaos: 10,
        listingCount: 5,
        detailsId: "mixed-all-specials-item-cool-base-6l",
      };
      const input: InternalItem[] = [
        nonSpecial1,
        nonSpecial2,
        relic,
        fiveL,
        sixL,
      ];
      const expected: InternalItem = { ...nonSpecial2, listingCount: 6 }; // Cheapest non-special's details, sum non-special counts: 4+2
      const output = dedupeCheapestVariants(input);
      expect(output).toEqual([expected]);
      expect(output[0].chaos).toBe(18);
      expect(output[0].listingCount).toBe(6);
      expect(output[0].detailsId).toBe(
        "mixed-all-specials-item-cool-base-variant",
      );
    });

    it("handles zero chaos: zero is valid low and is selected; sums counts", () => {
      const baseItem: Omit<InternalItem, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Zero Chaos Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "zero-chaos-item-cool-base",
        itemType: "Weapon",
      };
      const zeroChaos: InternalItem = {
        ...baseItem,
        chaos: 0,
        listingCount: 2,
      };
      const positiveChaos: InternalItem = {
        ...baseItem,
        chaos: 5,
        listingCount: 3,
      };
      const input: InternalItem[] = [zeroChaos, positiveChaos];

      const output = dedupeCheapestVariants(input);
      expect(output[0].chaos).toBe(0); // Confirms 0 is treated as valid low
      expect(output[0].listingCount).toBe(5);
    });

    it("handles zero listingCount: includes in sum if non-special", () => {
      const baseItem: Omit<InternalItem, "chaos" | "listingCount"> = {
        type: "UniqueWeapon",
        name: "Zero Count Item",
        baseType: "Cool Base",
        icon: "http://example.com/icon.png",
        detailsId: "zero-count-item-cool-base",
        itemType: "Weapon",
      };
      const item1: InternalItem = { ...baseItem, chaos: 10, listingCount: 0 };
      const item2: InternalItem = { ...baseItem, chaos: 15, listingCount: 3 };
      const input: InternalItem[] = [item1, item2];

      const output = dedupeCheapestVariants(input);
      expect(output[0].chaos).toBe(10);
      expect(output[0].listingCount).toBe(3);
    });
  });

  describe("Foulborn Handling", () => {
    it("detects Foulborn items correctly", () => {
      const foulbornItem: InternalItem = {
        type: "UniqueWeapon",
        name: "Foulborn The Surrender",
        chaos: 10,
        baseType: "Claw",
        icon: "http://example.com/foulborn.png",
        listingCount: 5,
        detailsId: "foulborn-the-surrender",
        itemType: "Weapon",
      };
      const regularItem: InternalItem = {
        type: "UniqueWeapon",
        name: "The Surrender",
        chaos: 15,
        baseType: "Claw",
        icon: "http://example.com/regular.png",
        listingCount: 3,
        detailsId: "the-surrender",
        itemType: "Weapon",
      };

      // Test Foulborn detection
      const input: InternalItem[] = [foulbornItem, regularItem];
      const output = dedupeCheapestVariants(input);

      // Should keep regular name but use cheaper price (Foulborn)
      expect(output).toHaveLength(1);
      expect(output[0].name).toBe("The Surrender"); // Keep regular name
      expect(output[0].chaos).toBe(10); // Use Foulborn price (cheaper)
      expect(output[0].listingCount).toBe(8); // Sum both counts
    });

    it("prefers regular item when it's cheaper than Foulborn", () => {
      const regularItem: InternalItem = {
        type: "UniqueWeapon",
        name: "The Surrender",
        chaos: 8,
        baseType: "Claw",
        icon: "http://example.com/regular.png",
        listingCount: 4,
        detailsId: "the-surrender",
        itemType: "Weapon",
      };
      const foulbornItem: InternalItem = {
        type: "UniqueWeapon",
        name: "Foulborn The Surrender",
        chaos: 10,
        baseType: "Claw",
        icon: "http://example.com/foulborn.png",
        listingCount: 2,
        detailsId: "foulborn-the-surrender",
        itemType: "Weapon",
      };

      const input: InternalItem[] = [regularItem, foulbornItem];
      const output = dedupeCheapestVariants(input);

      expect(output).toHaveLength(1);
      expect(output[0].name).toBe("The Surrender"); // Keep regular name
      expect(output[0].chaos).toBe(8); // Use regular price (cheaper)
      expect(output[0].listingCount).toBe(6); // Sum both counts
    });

    it("handles Foulborn items with special suffixes", () => {
      const regularItem: InternalItem = {
        type: "UniqueWeapon",
        name: "The Surrender",
        chaos: 20,
        baseType: "Claw",
        icon: "http://example.com/regular.png",
        listingCount: 2,
        detailsId: "the-surrender",
        itemType: "Weapon",
      };
      const foulbornRelic: InternalItem = {
        type: "UniqueWeapon",
        name: "Foulborn The Surrender",
        chaos: 12,
        baseType: "Claw",
        icon: "http://example.com/foulborn-relic.png",
        listingCount: 3,
        detailsId: "foulborn-the-surrender-relic",
        itemType: "Weapon",
      };
      const regularRelic: InternalItem = {
        type: "UniqueWeapon",
        name: "The Surrender",
        chaos: 15,
        baseType: "Claw",
        icon: "http://example.com/regular-relic.png",
        listingCount: 1,
        detailsId: "the-surrender-relic",
        itemType: "Weapon",
      };

      const input: InternalItem[] = [regularItem, foulbornRelic, regularRelic];
      const output = dedupeCheapestVariants(input);

      // Should keep the cheapest
      expect(output).toHaveLength(1);

      // Use foulborn price, keep regular name
      const baseResult = output.find((item) => item.name === "The Surrender");
      expect(baseResult).toBeDefined();
      expect(baseResult!.chaos).toBe(12); // Use foulborn price (cheaper)
      expect(baseResult!.listingCount).toBe(5); // Only regular + foulborn listings
    });

    it("handles multiple Foulborn variants with same base name", () => {
      const regularItem: InternalItem = {
        type: "UniqueWeapon",
        name: "The Surrender",
        chaos: 25,
        baseType: "Claw",
        icon: "http://example.com/regular.png",
        listingCount: 1,
        detailsId: "the-surrender",
        itemType: "Weapon",
      };
      const foulbornItem1: InternalItem = {
        type: "UniqueWeapon",
        name: "Foulborn The Surrender",
        chaos: 10,
        baseType: "Claw",
        icon: "http://example.com/foulborn1.png",
        listingCount: 2,
        detailsId: "foulborn-the-surrender",
        itemType: "Weapon",
      };
      const foulbornItem2: InternalItem = {
        type: "UniqueWeapon",
        name: "Foulborn The Surrender",
        chaos: 8,
        baseType: "Claw",
        icon: "http://example.com/foulborn2.png",
        listingCount: 3,
        detailsId: "foulborn-the-surrender-variant",
        itemType: "Weapon",
      };

      const input: InternalItem[] = [regularItem, foulbornItem1, foulbornItem2];
      const output = dedupeCheapestVariants(input);

      expect(output).toHaveLength(1);
      expect(output[0].name).toBe("The Surrender"); // Keep regular name
      expect(output[0].chaos).toBe(8); // Use cheapest Foulborn price
      expect(output[0].listingCount).toBe(6); // Sum all counts: 1 + 2 + 3
    });

    it("handles Foulborn items with different base names", () => {
      const regularItem1: InternalItem = {
        type: "UniqueWeapon",
        name: "The Surrender",
        chaos: 20,
        baseType: "Claw",
        icon: "http://example.com/regular1.png",
        listingCount: 2,
        detailsId: "the-surrender",
        itemType: "Weapon",
      };
      const foulbornItem1: InternalItem = {
        type: "UniqueWeapon",
        name: "Foulborn The Surrender",
        chaos: 15,
        baseType: "Claw",
        icon: "http://example.com/foulborn1.png",
        listingCount: 3,
        detailsId: "foulborn-the-surrender",
        itemType: "Weapon",
      };
      const regularItem2: InternalItem = {
        type: "UniqueWeapon",
        name: "Perseverance",
        chaos: 30,
        baseType: "Shield",
        icon: "http://example.com/regular2.png",
        listingCount: 1,
        detailsId: "perseverance",
        itemType: "Armour",
      };
      const foulbornItem2: InternalItem = {
        type: "UniqueWeapon",
        name: "Foulborn Perseverance",
        chaos: 25,
        baseType: "Shield",
        icon: "http://example.com/foulborn2.png",
        listingCount: 4,
        detailsId: "foulborn-perseverance",
        itemType: "Armour",
      };

      const input: InternalItem[] = [
        regularItem1,
        foulbornItem1,
        regularItem2,
        foulbornItem2,
      ];
      const output = dedupeCheapestVariants(input);

      expect(output).toHaveLength(2);

      // Check The Surrender group
      const surrenderResult = output.find(
        (item) => item.name === "The Surrender",
      );
      expect(surrenderResult).toBeDefined();
      expect(surrenderResult!.chaos).toBe(15); // Use Foulborn price
      expect(surrenderResult!.listingCount).toBe(5); // 2 + 3

      // Check Perseverance group
      const perseveranceResult = output.find(
        (item) => item.name === "Perseverance",
      );
      expect(perseveranceResult).toBeDefined();
      expect(perseveranceResult!.chaos).toBe(25); // Use Foulborn price
      expect(perseveranceResult!.listingCount).toBe(5); // 1 + 4
    });

    it("handles edge case where Foulborn name is exactly 'Foulborn '", () => {
      const foulbornItem: InternalItem = {
        type: "UniqueWeapon",
        name: "Foulborn ",
        chaos: 10,
        baseType: "Claw",
        icon: "http://example.com/foulborn.png",
        listingCount: 2,
        detailsId: "foulborn",
        itemType: "Weapon",
      };
      const regularItem: InternalItem = {
        type: "UniqueWeapon",
        name: "Foulborn ",
        chaos: 15,
        baseType: "Claw",
        icon: "http://example.com/regular.png",
        listingCount: 3,
        detailsId: "foulborn-regular",
        itemType: "Weapon",
      };

      const input: InternalItem[] = [foulbornItem, regularItem];
      const output = dedupeCheapestVariants(input);

      expect(output).toHaveLength(1);
      expect(output[0].name).toBe("Foulborn "); // Keep regular name
      expect(output[0].chaos).toBe(10); // Use Foulborn price
      expect(output[0].listingCount).toBe(5); // Sum both counts
    });

    it("keeps only the Foulborn item when no regular version exists", () => {
      const foulbornOnly: InternalItem = {
        type: "UniqueWeapon",
        name: "Foulborn The Surrender",
        chaos: 10,
        baseType: "Claw",
        icon: "http://example.com/foulborn.png",
        listingCount: 3,
        detailsId: "foulborn-the-surrender",
        itemType: "Weapon",
      };

      const input: InternalItem[] = [foulbornOnly];
      const output = dedupeCheapestVariants(input);

      // Should produce exactly one result
      expect(output).toHaveLength(1);

      // Should retain the Foulborn name
      expect(output[0].name).toBe("Foulborn The Surrender");

      // Should keep its own price and listing count
      expect(output[0].chaos).toBe(10);
      expect(output[0].listingCount).toBe(3);
    });
  });
});
