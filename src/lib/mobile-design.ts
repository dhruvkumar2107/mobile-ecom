export const mobileDesign = {
  colors: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    accent: '#059669',
    accentLight: '#D1FAE5',
    accentDark: '#047857',
    accentPress: '#065F46',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    error: '#DC2626',
    errorLight: '#FEF2F2',
    success: '#059669',
    successLight: '#ECFDF5',
    warning: '#D97706',
    warningLight: '#FFFBEB',
    overlay: 'rgba(17, 24, 39, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowStrong: 'rgba(0, 0, 0, 0.12)',
    plasma: '#8b5cf6',
    plasmaLight: '#F3F0FF',
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
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
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
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },
  transitions: {
    fast: '150ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-out',
    spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
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