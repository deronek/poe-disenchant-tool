"use client";

import type { EfficiencySettings } from "@/lib/efficiency";
import * as React from "react";

import {
  DEFAULT_EFFICIENCY_SETTINGS,
  EFFICIENCY_SETTINGS_STORAGE_KEY,
  EfficiencySettingsSchema,
} from "@/lib/efficiency";
import { useLocalStorage } from "@/lib/use-local-storage";

interface EfficiencySettingsContextValue {
  settings: EfficiencySettings;
  setSettings: React.Dispatch<React.SetStateAction<EfficiencySettings>>;
}

const EfficiencySettingsContext =
  React.createContext<EfficiencySettingsContextValue | null>(null);

interface EfficiencySettingsProviderProps {
  children: React.ReactNode;
}

export function EfficiencySettingsProvider({
  children,
}: EfficiencySettingsProviderProps) {
  const [settings, setSettings] = useLocalStorage<EfficiencySettings>(
    DEFAULT_EFFICIENCY_SETTINGS,
    EFFICIENCY_SETTINGS_STORAGE_KEY,
    {
      debounceDelay: 300,
      schema: EfficiencySettingsSchema,
    },
  );

  const value = React.useMemo(
    () => ({ settings, setSettings }),
    [settings, setSettings],
  );

  return (
    <EfficiencySettingsContext.Provider value={value}>
      {children}
    </EfficiencySettingsContext.Provider>
  );
}

export function useEfficiencySettings(): EfficiencySettingsContextValue {
  const context = React.useContext(EfficiencySettingsContext);

  if (!context) {
    throw new Error(
      "useEfficiencySettings must be used within EfficiencySettingsProvider",
    );
  }

  return context;
}
