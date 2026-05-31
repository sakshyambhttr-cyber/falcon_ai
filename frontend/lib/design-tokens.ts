/**
 * TypeScript mirror of CSS custom properties in styles/design.css.
 * Use for programmatic layout; prefer CSS variables in stylesheets.
 */

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64
} as const

export const radius = {
  small: 6,
  medium: 10,
  large: 14,
  xl: 20,
  pill: 999
} as const

export const fontSize = {
  xs: 11,
  caption: 12,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
  '4xl': 52
} as const

export const typeRole = {
  display: 'var(--type-display-size)',
  h1: 'var(--type-h1-size)',
  h2: 'var(--type-h2-size)',
  h3: 'var(--type-h3-size)',
  body: 'var(--type-body-size)',
  caption: 'var(--type-caption-size)'
} as const

export const surface = {
  cardBg: 'var(--surface-card-bg)',
  cardBorder: 'var(--surface-card-border)',
  cardShadow: 'var(--surface-card-shadow)',
  accentBg: 'var(--surface-accent-bg)',
  accentBorder: 'var(--surface-accent-border)',
  accentGlow: 'var(--surface-accent-glow)',
  insetBg: 'var(--surface-inset-bg)',
  insetBorder: 'var(--surface-inset-border)'
} as const

export const cssVar = {
  bg: 'var(--bg)',
  bgSurface: 'var(--bg-surface)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  neonBlue: 'var(--neon-blue)',
  neonCyan: 'var(--neon-cyan)',
  gradientHero: 'var(--gradient-hero)',
  sp: (n: keyof typeof spacing) => `var(--sp-${n})`,
  radius: (key: keyof typeof radius) =>
    key === 'small'
      ? 'var(--radius-sm)'
      : key === 'medium'
        ? 'var(--radius-md)'
        : key === 'large'
          ? 'var(--radius-lg)'
          : key === 'xl'
            ? 'var(--radius-xl)'
            : 'var(--radius-pill)'
} as const
