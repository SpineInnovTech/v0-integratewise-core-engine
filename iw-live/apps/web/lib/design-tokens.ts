/**
 * Design Tokens - Centralized spacing, typography, and layout constants
 * Ensures 100% consistency across all components
 */

/**
 * Spacing Scale (Tailwind default)
 * Use these values for consistent spacing throughout the app
 */
export const spacing = {
  xs: "0.5rem",    // 8px
  sm: "0.75rem",   // 12px
  md: "1rem",      // 16px
  lg: "1.5rem",    // 24px
  xl: "2rem",      // 32px
  "2xl": "2.5rem", // 40px
  "3xl": "3rem",   // 48px
} as const

/**
 * Typography Scale
 */
export const typography = {
  // Headings
  h1: {
    size: "text-3xl",      // 30px
    weight: "font-bold",
    lineHeight: "leading-tight",
    tracking: "tracking-tight",
  },
  h2: {
    size: "text-2xl",      // 24px
    weight: "font-semibold",
    lineHeight: "leading-tight",
    tracking: "tracking-tight",
  },
  h3: {
    size: "text-xl",        // 20px
    weight: "font-semibold",
    lineHeight: "leading-snug",
    tracking: "tracking-tight",
  },
  h4: {
    size: "text-lg",        // 18px
    weight: "font-semibold",
    lineHeight: "leading-snug",
  },
  // Body text
  body: {
    size: "text-base",      // 16px
    weight: "font-normal",
    lineHeight: "leading-relaxed",
  },
  bodySmall: {
    size: "text-sm",        // 14px
    weight: "font-normal",
    lineHeight: "leading-relaxed",
  },
  bodyLarge: {
    size: "text-lg",        // 18px
    weight: "font-normal",
    lineHeight: "leading-relaxed",
  },
  // Muted text
  muted: {
    size: "text-sm",
    weight: "font-normal",
    lineHeight: "leading-relaxed",
    color: "text-muted-foreground",
  },
} as const

/**
 * Layout Constants
 */
export const layout = {
  // Page padding
  pagePadding: "p-6",
  pagePaddingMobile: "p-4",
  // Content spacing
  contentSpacing: "space-y-6",
  sectionSpacing: "space-y-4",
  // Max widths
  maxWidth: {
    full: "max-w-full",
    "7xl": "max-w-7xl",
    "6xl": "max-w-6xl",
    "5xl": "max-w-5xl",
    "4xl": "max-w-4xl",
  },
  // Container padding
  containerPadding: "px-6",
  containerPaddingMobile: "px-4",
} as const

/**
 * Card Constants
 */
export const card = {
  padding: "p-6",
  paddingCompact: "p-4",
  gap: "space-y-4",
  gapCompact: "space-y-3",
  borderRadius: "rounded-lg",
  border: "border border-border",
  shadow: "shadow-sm",
  background: "bg-card",
} as const

/**
 * Button Sizes (matching shadcn/ui)
 */
export const button = {
  sm: "h-8 px-3 text-sm",
  default: "h-10 px-4",
  lg: "h-11 px-8",
  icon: "h-10 w-10",
  iconSm: "h-9 w-9",
} as const

/**
 * Input Sizes
 */
export const input = {
  sm: "h-8 px-3 text-sm",
  default: "h-10 px-4",
  lg: "h-11 px-4",
} as const

/**
 * Badge Sizes
 */
export const badge = {
  sm: "text-[10px] px-1.5 py-0.5",
  default: "text-xs px-2 py-1",
  lg: "text-sm px-2.5 py-1",
} as const

/**
 * Icon Sizes
 */
export const icon = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  default: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
} as const

/**
 * Grid Layouts
 */
export const grid = {
  cols1: "grid-cols-1",
  cols2: "grid-cols-1 md:grid-cols-2",
  cols3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  cols4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  gap: "gap-4",
  gapSm: "gap-3",
  gapLg: "gap-6",
} as const

/**
 * Standard Page Structure Classes
 */
export const page = {
  container: "min-h-full w-full",
  content: "space-y-6",
  header: "mb-6 space-y-2",
  section: "space-y-4",
} as const

/**
 * Helper function to combine typography classes
 */
export function getTypographyClass(
  variant: keyof typeof typography,
  className?: string
): string {
  const styles = typography[variant]
  return [
    styles.size,
    styles.weight,
    styles.lineHeight,
    styles.tracking,
    styles.color,
    className,
  ]
    .filter(Boolean)
    .join(" ")
}
