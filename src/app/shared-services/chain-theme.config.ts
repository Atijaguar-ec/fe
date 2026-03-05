/**
 * 🎨 Chain Theme Configuration
 * 
 * Defines color palettes and visual identity for each value chain.
 * Similar to chain-overrides.config.ts for translations.
 * 
 * Structure:
 * - Each chain (cocoa, shrimp, coffee) has a complete theme palette
 * - Themes include primary, secondary, and semantic colors
 * - CSS custom properties are generated from these values
 * 
 * Usage:
 * - ChainThemeService loads the appropriate theme based on PRIMARY_PRODUCT_TYPE
 * - Themes are applied dynamically via CSS custom properties
 * - No rebuild required when switching chains
 * 
 * @author INATrace DevOps Team
 * @version 1.0.0
 */

export interface ThemePalette {
  // Brand Colors
  primary: string;
  primaryLight: string;
  primaryLighter: string;
  primaryLightest: string;
  secondary: string;
  tertiary: string;

  // Semantic Colors
  success: string;
  info: string;
  warning: string;
  danger: string;
  light: string;
  dark: string;

  // Neutral Colors
  grayDark: string;
  gray: string;
  graySemi: string;
  grayLight: string;
  black: string;

  // Accent Colors (chain-specific)
  blue: string;
  blueLight: string;
  red: string;
  redLight: string;
  yellow: string;
  yellowLight: string;
  green: string;

  // B2C Frontend Specific (for product labels)
  b2cPrimaryColor?: string;
  b2cSecondaryColor?: string;
  b2cHeadingColor?: string;
  b2cTextColor?: string;
}

export interface ChainThemes {
  cocoa: ThemePalette;
  shrimp: ThemePalette;
  coffee: ThemePalette;
}

/**
 * Default theme palette (Cocoa/Coffee - earthy tones)
 */
const DEFAULT_THEME: ThemePalette = {
  // Brand Colors - Earthy brown (coffee/cocoa)
  primary: '#4B382A',
  primaryLight: '#A29891',
  primaryLighter: '#C5BFBB',
  primaryLightest: '#E8E6E4',
  secondary: '#281F18',
  tertiary: '#181B31',

  // Semantic Colors
  success: '#26AE60',
  info: '#1E90FF',
  warning: '#FFBB38',
  danger: '#DF1642',
  light: '#FCFCFC',
  dark: '#666666',

  // Neutral Colors
  grayDark: '#666666',
  gray: '#939393',
  graySemi: '#E6E6E6',
  grayLight: '#FCFCFC',
  black: '#212121',

  // Accent Colors
  blue: '#1E90FF',
  blueLight: '#4BA6FF',
  red: '#DF1642',
  redLight: '#E95C7B',
  yellow: '#FFBB38',
  yellowLight: '#FFCF74',
  green: '#26AE60',

  // B2C Defaults
  b2cPrimaryColor: '#4B382A',
  b2cSecondaryColor: '#281F18',
  b2cHeadingColor: '#212121',
  b2cTextColor: '#666666'
};

/**
 * Chain-specific theme configurations
 * 
 * SHRIMP: Aquatic blue/turquoise palette
 * COCOA: Default earthy browns
 * COFFEE: Default earthy browns (shares with cocoa)
 */
export const CHAIN_THEMES: ChainThemes = {
  // ============================================================================
  // COCOA - Default earthy brown theme
  // ============================================================================
  cocoa: {
    ...DEFAULT_THEME
  },

  // ============================================================================
  // SHRIMP - Aquatic blue/turquoise theme
  // ============================================================================
  shrimp: {
    // Brand Colors - Ocean blues and turquoise
    primary: '#0077BE',           // Deep ocean blue
    primaryLight: '#4DA6D8',      // Light blue
    primaryLighter: '#87CEEB',    // Sky blue
    primaryLightest: '#E0F4FF',   // Very light blue
    secondary: '#004F7C',         // Dark navy
    tertiary: '#00BFA5',          // Turquoise accent

    // Semantic Colors - Adjusted for aquatic theme
    success: '#00BFA5',           // Turquoise (growth, sustainability)
    info: '#0077BE',              // Primary blue
    warning: '#FFA726',           // Orange (caution)
    danger: '#EF5350',            // Red (alert)
    light: '#F5FBFF',             // Very light blue tint
    dark: '#263238',              // Dark blue-gray

    // Neutral Colors - Cool tones
    grayDark: '#546E7A',          // Blue-gray dark
    gray: '#90A4AE',              // Blue-gray medium
    graySemi: '#CFD8DC',          // Blue-gray light
    grayLight: '#ECEFF1',         // Blue-gray very light
    black: '#263238',             // Dark blue-gray

    // Accent Colors - Aquatic palette
    blue: '#0077BE',              // Primary blue
    blueLight: '#4DA6D8',         // Light blue
    red: '#EF5350',               // Coral red
    redLight: '#FF7F7F',          // Light coral
    yellow: '#FFC107',            // Amber
    yellowLight: '#FFD54F',       // Light amber
    green: '#00BFA5',             // Turquoise

    // B2C Specific - Shrimp branding
    b2cPrimaryColor: '#0077BE',
    b2cSecondaryColor: '#00BFA5',
    b2cHeadingColor: '#263238',
    b2cTextColor: '#546E7A'
  },

  // ============================================================================
  // COFFEE - Default earthy brown theme (same as cocoa)
  // ============================================================================
  coffee: {
    ...DEFAULT_THEME,
    // Optional: slight variations for coffee if needed
    // primary: '#5D4037',  // Darker brown if desired
  }
};

/**
 * Load theme configuration for a specific chain
 */
export function getChainTheme(chain: keyof ChainThemes): ThemePalette {
  return CHAIN_THEMES[chain] || CHAIN_THEMES.cocoa;
}

/**
 * Get CSS custom property names mapped to theme values
 */
export function getThemeCSSVariables(theme: ThemePalette): Record<string, string> {
  return {
    // Brand colors
    '--theme-primary': theme.primary,
    '--theme-primary-light': theme.primaryLight,
    '--theme-primary-lighter': theme.primaryLighter,
    '--theme-primary-lightest': theme.primaryLightest,
    '--theme-secondary': theme.secondary,
    '--theme-tertiary': theme.tertiary,

    // Semantic colors
    '--theme-success': theme.success,
    '--theme-info': theme.info,
    '--theme-warning': theme.warning,
    '--theme-danger': theme.danger,
    '--theme-light': theme.light,
    '--theme-dark': theme.dark,

    // Neutral colors
    '--theme-gray-dark': theme.grayDark,
    '--theme-gray': theme.gray,
    '--theme-gray-semi': theme.graySemi,
    '--theme-gray-light': theme.grayLight,
    '--theme-black': theme.black,

    // Accent colors
    '--theme-blue': theme.blue,
    '--theme-blue-light': theme.blueLight,
    '--theme-red': theme.red,
    '--theme-red-light': theme.redLight,
    '--theme-yellow': theme.yellow,
    '--theme-yellow-light': theme.yellowLight,
    '--theme-green': theme.green,

    // B2C colors
    '--theme-b2c-primary': theme.b2cPrimaryColor || theme.primary,
    '--theme-b2c-secondary': theme.b2cSecondaryColor || theme.secondary,
    '--theme-b2c-heading': theme.b2cHeadingColor || theme.black,
    '--theme-b2c-text': theme.b2cTextColor || theme.grayDark
  };
}

/**
 * Validate theme palette completeness
 */
export function validateTheme(theme: ThemePalette): boolean {
  const requiredKeys: (keyof ThemePalette)[] = [
    'primary', 'secondary', 'success', 'info', 'warning', 'danger',
    'light', 'dark', 'grayDark', 'gray', 'graySemi', 'grayLight', 'black'
  ];

  return requiredKeys.every(key => !!theme[key]);
}
