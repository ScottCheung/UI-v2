// Main component exports
export { AnimatedNumber } from './components/AnimatedNumber';
export { SimpleAnimatedNumber } from './components/SimpleAnimatedNumber';

// Type exports
export type {
  AnimatedNumberProps,
  AnimationType,
  FormattedNumberParts,
  NumberFormat,
  NumberType,
  FontSize,
  FontWeight
} from './types';

// Utility exports
export { getVariants } from './utils/animationVariants';
export { formatNumber, parseFormattedNumber } from './utils/formatters';
export { formatNumberValue, formatShort, formatToSignificantDigits } from './utils/numberFormatters';
    