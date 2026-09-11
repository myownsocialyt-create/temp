/**
 * The 18 word-highlight colors (per spec).
 * Each found word is assigned the next color (cycling); the color is used as
 * the cell background at 35% opacity.
 */
export type WordColor = {
  name: string;
  /** Base hex color. */
  base: string;
  /** Cell background = base color at 35% opacity. */
  bg: string;
  /** Softer tint used for word chips. */
  chip: string;
};

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function makeColor(name: string, base: string): WordColor {
  return { name, base, bg: withAlpha(base, 0.35), chip: withAlpha(base, 0.16) };
}

export const WORD_COLORS: WordColor[] = [
  makeColor('Red', '#ef4444'),
  makeColor('Blue', '#3b82f6'),
  makeColor('Green', '#22c55e'),
  makeColor('Yellow', '#eab308'),
  makeColor('Pink', '#ec4899'),
  makeColor('Orange', '#f97316'),
  makeColor('Purple', '#8b5cf6'),
  makeColor('Teal', '#14b8a6'),
  makeColor('Rose', '#f43f5e'),
  makeColor('Cyan', '#06b6d4'),
  makeColor('Lime', '#84cc16'),
  makeColor('Violet', '#7c3aed'),
  makeColor('Amber', '#f59e0b'),
  makeColor('Emerald', '#10b981'),
  makeColor('Fuchsia', '#d946ef'),
  makeColor('Sky', '#0ea5e9'),
  makeColor('Light-Green', '#65a30d'),
  makeColor('Light-Orange', '#ea9a3f'),
];

export function wordColorFor(index: number): WordColor {
  return WORD_COLORS[index % WORD_COLORS.length];
}
