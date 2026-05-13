export type ThemeColorId = "executive-blue" | "operational-green" | "modern-purple" | "energy-orange" | "professional-gray";
export type ThemeAppearance = "light" | "dark";

export type ThemeCssVariables = Record<string, string>;

export interface ThemeColorConfig {
  id: ThemeColorId;
  name: string;
  description: string;
  preview: string;
  variables: Record<ThemeAppearance, ThemeCssVariables>;
}

const semanticVariables: ThemeCssVariables = {
  "--success": "152 60% 36%",
  "--success-foreground": "0 0% 100%",
  "--warning": "38 92% 50%",
  "--warning-foreground": "0 0% 100%",
  "--destructive": "0 72% 51%",
  "--destructive-foreground": "0 0% 98%",
  "--radius": "0.75rem",
};

const lightBaseVariables: ThemeCssVariables = {
  "--background": "210 40% 98%",
  "--foreground": "215 28% 17%",
  "--card": "0 0% 100%",
  "--card-foreground": "215 28% 17%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "215 28% 17%",
  "--secondary": "210 40% 96%",
  "--secondary-foreground": "215 28% 17%",
  "--muted": "210 40% 96%",
  "--muted-foreground": "215 16% 47%",
  "--border": "214 32% 91%",
  "--input": "214 32% 91%",
  "--shadow-card": "0 1px 2px 0 hsl(215 28% 17% / 0.04), 0 1px 3px 0 hsl(215 28% 17% / 0.06)",
  "--sidebar-background": "0 0% 100%",
  "--sidebar-foreground": "215 20% 35%",
  "--sidebar-primary-foreground": "0 0% 100%",
  "--sidebar-border": "214 32% 91%",
  ...semanticVariables,
};

const darkBaseVariables: ThemeCssVariables = {
  "--background": "222 47% 7%",
  "--foreground": "210 40% 98%",
  "--card": "222 39% 11%",
  "--card-foreground": "210 40% 98%",
  "--popover": "222 39% 11%",
  "--popover-foreground": "210 40% 98%",
  "--secondary": "217 32% 17%",
  "--secondary-foreground": "210 40% 98%",
  "--muted": "217 32% 17%",
  "--muted-foreground": "215 20% 70%",
  "--border": "217 28% 22%",
  "--input": "217 28% 22%",
  "--shadow-card": "0 1px 2px 0 hsl(0 0% 0% / 0.22), 0 1px 3px 0 hsl(0 0% 0% / 0.28)",
  "--sidebar-background": "222 47% 6%",
  "--sidebar-foreground": "215 20% 82%",
  "--sidebar-primary-foreground": "0 0% 100%",
  "--sidebar-border": "217 28% 18%",
  ...semanticVariables,
  "--destructive": "0 63% 46%",
};

function withPalette(
  base: ThemeCssVariables,
  palette: Pick<
    ThemeCssVariables,
    "--primary" | "--primary-foreground" | "--primary-soft" | "--accent" | "--accent-foreground" | "--ring" | "--sidebar-primary" | "--sidebar-accent" | "--sidebar-accent-foreground" | "--sidebar-ring"
  >,
): ThemeCssVariables {
  return { ...base, ...palette };
}

// Para adicionar novas paletas no futuro, inclua uma entrada em themeColorOptions
// e mantenha os tokens em HSL sem o wrapper hsl(), preservando compatibilidade Tailwind/shadcn.
export const themeColorOptions: ThemeColorConfig[] = [
  {
    id: "executive-blue",
    name: "Azul Executivo",
    description: "Institucional, próximo ao visual atual.",
    preview: "201 96% 24%",
    variables: {
      light: withPalette(lightBaseVariables, {
        "--primary": "201 96% 24%",
        "--primary-foreground": "210 40% 98%",
        "--primary-soft": "201 70% 94%",
        "--accent": "201 70% 94%",
        "--accent-foreground": "201 96% 24%",
        "--ring": "201 96% 24%",
        "--sidebar-primary": "201 96% 24%",
        "--sidebar-accent": "201 70% 96%",
        "--sidebar-accent-foreground": "201 96% 24%",
        "--sidebar-ring": "201 96% 24%",
      }),
      dark: withPalette(darkBaseVariables, {
        "--primary": "201 86% 36%",
        "--primary-foreground": "210 40% 98%",
        "--primary-soft": "201 52% 18%",
        "--accent": "201 52% 18%",
        "--accent-foreground": "201 82% 78%",
        "--ring": "201 86% 52%",
        "--sidebar-primary": "201 86% 36%",
        "--sidebar-accent": "201 42% 16%",
        "--sidebar-accent-foreground": "201 82% 78%",
        "--sidebar-ring": "201 86% 52%",
      }),
    },
  },
  {
    id: "operational-green",
    name: "Verde Operacional",
    description: "Processo, execução e avanço.",
    preview: "154 64% 30%",
    variables: {
      light: withPalette(lightBaseVariables, {
        "--primary": "154 64% 30%",
        "--primary-foreground": "0 0% 100%",
        "--primary-soft": "150 60% 93%",
        "--accent": "150 60% 93%",
        "--accent-foreground": "154 64% 25%",
        "--ring": "154 64% 30%",
        "--sidebar-primary": "154 64% 30%",
        "--sidebar-accent": "150 60% 95%",
        "--sidebar-accent-foreground": "154 64% 25%",
        "--sidebar-ring": "154 64% 30%",
      }),
      dark: withPalette(darkBaseVariables, {
        "--primary": "154 62% 30%",
        "--primary-foreground": "0 0% 100%",
        "--primary-soft": "154 40% 17%",
        "--accent": "154 40% 17%",
        "--accent-foreground": "154 62% 78%",
        "--ring": "154 62% 52%",
        "--sidebar-primary": "154 62% 30%",
        "--sidebar-accent": "154 34% 15%",
        "--sidebar-accent-foreground": "154 62% 78%",
        "--sidebar-ring": "154 62% 52%",
      }),
    },
  },
  {
    id: "modern-purple",
    name: "Roxo Moderno",
    description: "Tecnológico e contemporâneo.",
    preview: "262 68% 42%",
    variables: {
      light: withPalette(lightBaseVariables, {
        "--primary": "262 68% 42%",
        "--primary-foreground": "0 0% 100%",
        "--primary-soft": "262 78% 96%",
        "--accent": "262 78% 96%",
        "--accent-foreground": "262 68% 38%",
        "--ring": "262 68% 42%",
        "--sidebar-primary": "262 68% 42%",
        "--sidebar-accent": "262 78% 96%",
        "--sidebar-accent-foreground": "262 68% 38%",
        "--sidebar-ring": "262 68% 42%",
      }),
      dark: withPalette(darkBaseVariables, {
        "--primary": "262 70% 58%",
        "--primary-foreground": "0 0% 100%",
        "--primary-soft": "262 42% 20%",
        "--accent": "262 42% 20%",
        "--accent-foreground": "262 86% 82%",
        "--ring": "262 70% 64%",
        "--sidebar-primary": "262 70% 58%",
        "--sidebar-accent": "262 36% 18%",
        "--sidebar-accent-foreground": "262 86% 82%",
        "--sidebar-ring": "262 70% 64%",
      }),
    },
  },
  {
    id: "energy-orange",
    name: "Laranja Energia",
    description: "Chamativo sem perder profissionalismo.",
    preview: "24 90% 40%",
    variables: {
      light: withPalette(lightBaseVariables, {
        "--primary": "24 90% 40%",
        "--primary-foreground": "0 0% 100%",
        "--primary-soft": "32 100% 94%",
        "--accent": "32 100% 94%",
        "--accent-foreground": "24 90% 34%",
        "--ring": "24 90% 40%",
        "--sidebar-primary": "24 90% 40%",
        "--sidebar-accent": "32 100% 95%",
        "--sidebar-accent-foreground": "24 90% 34%",
        "--sidebar-ring": "24 90% 40%",
      }),
      dark: withPalette(darkBaseVariables, {
        "--primary": "24 84% 52%",
        "--primary-foreground": "20 14% 4%",
        "--primary-soft": "24 48% 19%",
        "--accent": "24 48% 19%",
        "--accent-foreground": "32 96% 78%",
        "--ring": "24 84% 58%",
        "--sidebar-primary": "24 84% 52%",
        "--sidebar-accent": "24 40% 17%",
        "--sidebar-accent-foreground": "32 96% 78%",
        "--sidebar-ring": "24 84% 58%",
      }),
    },
  },
  {
    id: "professional-gray",
    name: "Cinza Profissional",
    description: "Neutro, sóbrio e corporativo.",
    preview: "215 19% 35%",
    variables: {
      light: withPalette(lightBaseVariables, {
        "--primary": "215 19% 35%",
        "--primary-foreground": "0 0% 100%",
        "--primary-soft": "214 20% 93%",
        "--accent": "214 20% 93%",
        "--accent-foreground": "215 19% 30%",
        "--ring": "215 19% 35%",
        "--sidebar-primary": "215 19% 35%",
        "--sidebar-accent": "214 20% 94%",
        "--sidebar-accent-foreground": "215 19% 30%",
        "--sidebar-ring": "215 19% 35%",
      }),
      dark: withPalette(darkBaseVariables, {
        "--primary": "215 18% 56%",
        "--primary-foreground": "222 47% 7%",
        "--primary-soft": "215 18% 20%",
        "--accent": "215 18% 20%",
        "--accent-foreground": "214 24% 82%",
        "--ring": "215 18% 62%",
        "--sidebar-primary": "215 18% 56%",
        "--sidebar-accent": "215 18% 17%",
        "--sidebar-accent-foreground": "214 24% 82%",
        "--sidebar-ring": "215 18% 62%",
      }),
    },
  },
];

export const defaultThemeColor: ThemeColorId = "executive-blue";
export const defaultThemeAppearance: ThemeAppearance = "light";
export const themeStorageKey = "popflow-theme-preferences";

export function getThemeColorOption(themeColor: ThemeColorId) {
  return themeColorOptions.find((option) => option.id === themeColor) ?? themeColorOptions[0];
}
