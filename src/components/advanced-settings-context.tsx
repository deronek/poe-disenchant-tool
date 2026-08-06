"use client";

import type { AdvancedSettings } from "@/lib/advanced-settings";
import * as React from "react";

import {
  ADVANCED_SETTINGS_STORAGE_KEY,
  AdvancedSettingsSchema,
  DEFAULT_ADVANCED_SETTINGS,
  migrateLegacyAdvancedSettings,
} from "@/lib/advanced-settings";
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
    ADVANCED_SETTINGS_STORAGE_KEY,
    {
      debounceDelay: 300,
      schema: AdvancedSettingsSchema,
    },
  );

  React.useEffect(() => {
    const migrated = migrateLegacyAdvancedSettings(window.localStorage);
    if (migrated !== null) {
      setSettings(migrated);
    }
  }, [setSettings]);

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
