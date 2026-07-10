export const FONT_SIZES = {
  sm: "87.5%",
  md: "100%",
  lg: "112.5%",
  xl: "125%",
} as const;

export type FontSizeKey = keyof typeof FONT_SIZES;

export const FONT_SIZE_LABELS: Record<FontSizeKey, string> = {
  sm: "Small",
  md: "Default",
  lg: "Large",
  xl: "Extra large",
};

export const FONT_SIZE_STORAGE_KEY = "font-size";
