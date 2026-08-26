/**
 * Mobile design-system entry point.
 *
 * Tokens live here; components are re-exported from `@/components/mobile`
 * so a screen can pull everything it needs from one import.
 */
export {
  mobileDesign,
  type MobileDesign,
  getDesignTokens,
  cssVar,
  generateCSSVariables,
} from '../mobile-design';

export * from '@/components/mobile';
