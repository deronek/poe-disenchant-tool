"use client";

import type { AdvancedSettings } from "@/components/advanced-settings-panel";
import * as React from "react";

import {
  AdvancedSettingsSchema,
  DEFAULT_ADVANCED_SETTINGS,
} from "@/components/advanced-settings-panel";
import { useLocalStorage } from "@/lib/use-local-storage";

interface AdvancedSettingsContextValue {
  settings: AdvancedSettings;
  setSettings: React.Dispatch<React.SetStateAction<AdvancedSettings>>;
}

const AdvancedSettingsContext =
  React.createContext<AdvancedSettingsContextValue | null>(null);

interface AdvancedSettingsProviderProps {
  children: React.ReactNode;
}

export function AdvancedSettingsProvider({
  children,
}: AdvancedSettingsProviderProps) {
  const [settings, setSettings] = useLocalStorage<AdvancedSettings>(
    DEFAULT_ADVANCED_SETTINGS,
    "poe-udt:trade-settings:v1",
    {
      debounceDelay: 300,
      schema: AdvancedSettingsSchema,
    },
  );

  const value = React.useMemo(
    () => ({ settings, setSettings }),
    [settings, setSettings],
  );

  return (
    <AdvancedSettingsContext.Provider value={value}>
      {children}
    </AdvancedSettingsContext.Provider>
  );
}

export function useAdvancedSettings(): AdvancedSettingsContextValue {
  const ctx = React.useContext(AdvancedSettingsContext);
  if (!ctx) {
    throw new Error(
      "useAdvancedSettings must be used within an AdvancedSettingsProvider",
    );
  }
  return ctx;
}
