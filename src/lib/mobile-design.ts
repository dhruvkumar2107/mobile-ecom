export const mobileDesign = {
  colors: {
    background: '#F1F3F6',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    accent: '#2874F0',
    accentLight: '#E8F0FE',
    accentDark: '#1A5DC8',
    accentPress: '#14469E',
    textPrimary: '#212121',
    textSecondary: '#666666',
    textTertiary: '#878787',
    textInverse: '#FFFFFF',
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    error: '#FF6161',
    errorLight: '#FFF0F0',
    success: '#26A541',
    successLight: '#E8F5E9',
    warning: '#FF9F00',
    warningLight: '#FFF8E1',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowStrong: 'rgba(0, 0, 0, 0.15)',
    plasma: '#8b5cf6',
    plasmaLight: '#F3F0FF',
    flipkartBlue: '#2874F0',
    flipkartBlueDark: '#1E5FC0',
    flipkartYellow: '#FFE500',
    flipkartGreen: '#26A541',
    flipkartRed: '#FF6161',
    flipkartOrange: '#FF9F00',
    flipkartPurple: '#7B1FA2',
    flipkartPink: '#E91E63',
    flipkartTeal: '#009688',
    flipkartIndigo: '#3F51B5',
    flipkartCyan: '#00BCD4',
    flipkartLime: '#CDDC39',
    flipkartAmber: '#FFC107',
    flipkartDeepOrange: '#FF5722',
    flipkartBrown: '#795548',
    flipkartGrey: '#9E9E9E',
    flipkartBlueGrey: '#607D8B',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
  typography: {
    fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    displayLarge: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40, letterSpacing: -0.5 },
    displayMedium: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36, letterSpacing: -0.25 },
    displaySmall: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
    headlineLarge: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
    headlineMedium: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
    headlineSmall: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    titleLarge: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
    titleMedium: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
    titleSmall: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
    bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
    labelLarge: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
    labelMedium: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
    labelSmall: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14, letterSpacing: 0.5 },
  },
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    flipkart: '0 2px 8px rgba(40, 116, 240, 0.25)',
    flipkartHover: '0 4px 12px rgba(40, 116, 240, 0.35)',
  },
  transitions: {
    fast: '150ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-out',
    spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  touchTarget: 44,
  breakpoints: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
  },
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    modal: 300,
    popover: 400,
    toast: 500,
    tooltip: 600,
    overlay: 700,
  },
  gradients: {
    flipkartBlue: 'linear-gradient(135deg, #2874F0 0%, #1E5FC0 100%)',
    flipkartYellow: 'linear-gradient(135deg, #FFE500 0%, #FFC107 100%)',
    flipkartGreen: 'linear-gradient(135deg, #26A541 0%, #1E8E3E 100%)',
    flipkartOrange: 'linear-gradient(135deg, #FF9F00 0%, #FF6D00 100%)',
    flipkartRed: 'linear-gradient(135deg, #FF6161 0%, #E53935 100%)',
    flipkartPurple: 'linear-gradient(135deg, #7B1FA2 0%, #6A1B9A 100%)',
    flipkartPink: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
    flipkartTeal: 'linear-gradient(135deg, #009688 0%, #00796B 100%)',
    flipkartIndigo: 'linear-gradient(135deg, #3F51B5 0%, #303F9F 100%)',
    flipkartCyan: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
    flipkartLime: 'linear-gradient(135deg, #CDDC39 0%, #AFB42B 100%)',
    flipkartAmber: 'linear-gradient(135deg, #FFC107 0%, #FFA000 100%)',
    flipkartDeepOrange: 'linear-gradient(135deg, #FF5722 0%, #E64A19 100%)',
    flipkartBrown: 'linear-gradient(135deg, #795548 0%, #5D4037 100%)',
    flipkartGrey: 'linear-gradient(135deg, #9E9E9E 0%, #757575 100%)',
    flipkartBlueGrey: 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)',
    flipkartDark: 'linear-gradient(135deg, #212121 0%, #121212 100%)',
    flipkartLight: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)',
    flipkartMixed: 'linear-gradient(135deg, #2874F0 0%, #FFE500 100%)',
  },
} as const;

export type MobileDesign = typeof mobileDesign;

export function getDesignTokens() {
  return mobileDesign;
}

export function cssVar(name: string, value: string) {
  return `--mobile-${name}: ${value};`;
}

export function generateCSSVariables(): string {
  const tokens = mobileDesign;
  let css = ':root {\n';
  
  Object.entries(tokens.colors).forEach(([key, value]) => {
    css += `  ${cssVar(`color-${key}`, value)}`;
  });
  
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    css += `  ${cssVar(`space-${key}`, `${value}px`)}`;
  });
  
  Object.entries(tokens.borderRadius).forEach(([key, value]) => {
    css += `  ${cssVar(`radius-${key}`, `${value}px`)}`;
  });
  
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    css += `  ${cssVar(`shadow-${key}`, value)}`;
  });
  
  Object.entries(tokens.transitions).forEach(([key, value]) => {
    css += `  ${cssVar(`transition-${key}`, value)}`;
  });
  
  css += `  ${cssVar('touch-target', `${tokens.touchTarget}px`)}`;
  css += `  ${cssVar('font-family', tokens.typography.fontFamily)}`;
  
  css += '}\n';
  return css;
}