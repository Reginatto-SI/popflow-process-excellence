import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  defaultThemeAppearance,
  defaultThemeColor,
  getThemeColorOption,
  themeColorOptions,
  themeStorageKey,
  type ThemeAppearance,
  type ThemeColorId,
} from "@/theme-config";

interface ThemePreferences {
  color: ThemeColorId;
  appearance: ThemeAppearance;
}

interface ThemeContextValue extends ThemePreferences {
  colorOptions: typeof themeColorOptions;
  setColor: (color: ThemeColorId) => void;
  setAppearance: (appearance: ThemeAppearance) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemeColorId(value: unknown): value is ThemeColorId {
  return typeof value === "string" && themeColorOptions.some((option) => option.id === value);
}

function isThemeAppearance(value: unknown): value is ThemeAppearance {
  return value === "light" || value === "dark";
}

function readStoredPreferences(): ThemePreferences {
  if (typeof window === "undefined") {
    return { color: defaultThemeColor, appearance: defaultThemeAppearance };
  }

  const storedValue = window.localStorage.getItem(themeStorageKey);
  if (!storedValue) {
    return { color: defaultThemeColor, appearance: defaultThemeAppearance };
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<ThemePreferences>;
    return {
      color: isThemeColorId(parsedValue.color) ? parsedValue.color : defaultThemeColor,
      appearance: isThemeAppearance(parsedValue.appearance) ? parsedValue.appearance : defaultThemeAppearance,
    };
  } catch {
    return { color: defaultThemeColor, appearance: defaultThemeAppearance };
  }
}

function applyTheme({ color, appearance }: ThemePreferences) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const selectedTheme = getThemeColorOption(color);
  const variables = selectedTheme.variables[appearance];

  // A troca visual fica centralizada nos tokens CSS globais, evitando hardcode em botões/cards.
  Object.entries(variables).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });

  root.classList.toggle("dark", appearance === "dark");
  root.dataset.themeColor = color;
  root.dataset.themeAppearance = appearance;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<ThemePreferences>(() => readStoredPreferences());

  useLayoutEffect(() => {
    // Aplica antes da pintura do React para reduzir flash entre o fallback do CSS e o tema salvo.
    applyTheme(preferences);
  }, [preferences]);

  useEffect(() => {
    // Persistência local apenas no navegador; não altera banco, autenticação ou regras de negócio.
    window.localStorage.setItem(themeStorageKey, JSON.stringify(preferences));
  }, [preferences]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...preferences,
      colorOptions: themeColorOptions,
      setColor: (color) => setPreferences((current) => ({ ...current, color })),
      setAppearance: (appearance) => setPreferences((current) => ({ ...current, appearance })),
    }),
    [preferences],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme deve ser utilizado dentro de ThemeProvider.");
  }

  return context;
}
