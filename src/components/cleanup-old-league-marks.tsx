"use client";

import { useEffect } from "react";

import { isValidLeague } from "@/lib/leagues";

/**
 * Cleanup component that removes localStorage keys for leagues that no longer exist.
 * Runs once on app load.
 */
export function CleanupOldLeagueMarks() {
  useEffect(() => {
    const keysToRemove: string[] = [];

    // Check all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Remove old global v1 key
      if (key === "poe-udt:selected:v1") {
        keysToRemove.push(key);
        continue;
      }

      // Match keys like "poe-udt:selected:some-league:v2"
      const match = key.match(/^poe-udt:selected:(.+):v2$/);
      if (match) {
        const league = match[1];
        if (!isValidLeague(league)) {
          keysToRemove.push(key);
        }
      }
    }

    // Remove invalid keys
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      console.log(`Cleaned up old league marks for: ${key}`);
    });

    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} old league mark(s)`);
    }
  }, []);

  return null; // This component doesn't render anything
}
