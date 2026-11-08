/**
 * Centralized Design System Themes & Color Tokens
 *
 * Extracted from the "Old Money" palette:
 * - Swatch 1: Obsidian Black (#000000 / #0d0d0c)
 * - Swatch 2: Charcoal Slate (#5e5956)
 * - Swatch 3: Stone Pewter (#99948e)
 * - Swatch 4: Imperial Oxblood Burgundy (#5f0e0d)
 * - Swatch 5: Alabaster Cream (#f3efe6)
 * - Canvas Background: Espresso Charcoal (#32312f)
 */

export interface PaletteTokens {
  readonly obsidianBlack: string;
  readonly charcoalSlate: string;
  readonly stonePewter: string;
  readonly oxbloodBurgundy: string;
  readonly alabasterCream: string;
  readonly charcoalCanvas: string;
}

export const OLD_MONEY_PALETTE: PaletteTokens = {
  obsidianBlack: "#000000",
  charcoalSlate: "#5e5956",
  stonePewter: "#99948e",
  oxbloodBurgundy: "#5f0e0d",
  alabasterCream: "#f3efe6",
  charcoalCanvas: "#32312f",
} as const;

export interface DesignTheme {
  readonly id: string;
  readonly name: string;
  readonly palette: PaletteTokens;
  readonly semantic: {
    readonly bgCanvas: string;
    readonly bgGlowPrimary: string;
    readonly bgGlowSecondary: string;
    readonly cardBg: string;
    readonly cardInner: string;
    readonly border: string;
    readonly borderFocus: string;
    readonly textPrimary: string;
    readonly textMuted: string;
    readonly textSubtle: string;
    readonly primary: string;
    readonly primaryHover: string;
    readonly primaryActive: string;
    readonly primaryGlow: string;
    readonly secondary: string;
    readonly secondaryHover: string;
    readonly accent: string;
    readonly accentGlow: string;
    readonly danger: string;
    readonly dangerBg: string;
  };
}

export const oldMoneyTheme: DesignTheme = {
  id: "old-money",
  name: "Old Money Luxury",
  palette: OLD_MONEY_PALETTE,
  semantic: {
    bgCanvas: "#141312",
    bgGlowPrimary: "rgba(95, 14, 13, 0.22)", // Oxblood ambient glow
    bgGlowSecondary: "rgba(50, 49, 47, 0.45)", // Charcoal canvas ambient
    cardBg: "rgba(31, 30, 28, 0.85)", // Muted charcoal glass
    cardInner: "#171615",
    border: "rgba(153, 148, 142, 0.16)", // Stone pewter border
    borderFocus: "#c4a35a",
    textPrimary: "#f3efe6", // Alabaster cream
    textMuted: "#99948e", // Stone pewter
    textSubtle: "#8c8780", // Charcoal slate (remediated for WCAG AA 4.5:1)
    primary: "#5f0e0d", // Imperial oxblood
    primaryHover: "#781615",
    primaryActive: "#4d0b0a",
    primaryGlow: "rgba(95, 14, 13, 0.4)",
    secondary: "#262423",
    secondaryHover: "#33312f",
    accent: "#c4a35a", // Warm champagne gold
    accentGlow: "rgba(196, 163, 90, 0.25)",
    danger: "#991b1b",
    dangerBg: "rgba(153, 27, 27, 0.15)",
  },
};

/**
 * Generate CSS custom properties string from a DesignTheme
 */
export function themeToCssVariables(theme: DesignTheme = oldMoneyTheme): string {
  const { semantic, palette } = theme;
  return `
    --palette-obsidian: ${palette.obsidianBlack};
    --palette-charcoal-slate: #8c8780;
    --palette-stone-pewter: ${palette.stonePewter};
    --palette-oxblood: ${palette.oxbloodBurgundy};
    --palette-cream: ${palette.alabasterCream};
    --palette-canvas: ${palette.charcoalCanvas};

    --bg: ${semantic.bgCanvas};
    --bg-glow-1: ${semantic.bgGlowPrimary};
    --bg-glow-2: ${semantic.bgGlowSecondary};
    --card-bg: ${semantic.cardBg};
    --card-inner: ${semantic.cardInner};
    --border: ${semantic.border};
    --border-focus: ${semantic.borderFocus};
    --text: ${semantic.textPrimary};
    --text-muted: ${semantic.textMuted};
    --text-subtle: ${semantic.textSubtle};
    --primary: ${semantic.primary};
    --primary-hover: ${semantic.primaryHover};
    --primary-active: ${semantic.primaryActive};
    --primary-glow: ${semantic.primaryGlow};
    --secondary: ${semantic.secondary};
    --secondary-hover: ${semantic.secondaryHover};
    --accent: ${semantic.accent};
    --accent-glow: ${semantic.accentGlow};
    --danger: ${semantic.danger};
    --danger-bg: ${semantic.dangerBg};
  `;
}

