/**
 * NexShell Theme Tokens
 * 
 * Centralized color token definitions for consistent theming across the application.
 * All colors are defined as CSS variables in variables.css and referenced here for type safety.
 */

/**
 * Color token names matching CSS variables
 */
export const ColorTokens = {
  // Device/Hostname colors
  deviceRed: 'var(--color-device-red)',
  atPurple: 'var(--color-at-purple)',
  nexshellBlue: 'var(--color-nexshell-blue)',
  cwdGreen: 'var(--color-cwd-green)',
  pipe: 'var(--color-pipe)',
  permViolet: 'var(--color-perm-violet)',
  
  // Command input colors
  commandYellow: 'var(--color-command-yellow)',
  nexusRed: 'var(--color-nexus-red)',
  
  // UI accent colors
  connectorNeon: 'var(--color-connector-neon)',
  arrow: 'var(--color-arrow)',
  
  // Surface colors
  surface: 'var(--color-surface)',
  surfaceAlt: 'var(--color-surface-alt)'
} as const;

/**
 * Get color token by name (type-safe)
 */
export function getColorToken(token: keyof typeof ColorTokens): string {
  return ColorTokens[token];
}

/**
 * Command color rules
 * - Normal commands: yellow
 * - nexus prefix: neon red
 */
export const CommandColors = {
  normal: ColorTokens.commandYellow,
  nexus: ColorTokens.nexusRed
} as const;



