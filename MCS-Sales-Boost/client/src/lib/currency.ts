/**
 * Format a number as Mauritian Rupee (Rs) with appropriate abbreviations
 *
 * @param value - The number to format
 * @param options - Optional configuration
 * @returns Formatted currency string
 *
 * Examples:
 * - formatCurrency(5000) => "Rs 5K"
 * - formatCurrency(5334) => "Rs 5.3K"
 * - formatCurrency(1500000) => "Rs 1.5M"
 */
export function formatCurrency(value: number, options: {
  maximumFractionDigits?: number;
  compact?: boolean;
} = {}) {
  // Default options
  const { maximumFractionDigits = 1, compact = true } = options;
  
  if (compact) {
    if (value >= 1000000) {
      // For values >= 1,000,000, use M suffix (e.g., Rs 1.5M)
      return `Rs ${(value / 1000000).toFixed(2).replace(/\.?0+$/, '')}M`;
    } else if (value >= 100000) {
      // For values >= 100,000, use K suffix with no decimal (e.g., Rs 500K)
      return `Rs ${(value / 1000).toFixed(0)}K`;
    } else if (value >= 1000) {
      // For values >= 1,000, use K suffix with one decimal (e.g., Rs 5.3K)
      return `Rs ${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    // For values < 1,000, just show the value (e.g., Rs 500)
    return `Rs ${value.toFixed(0)}`;
  } else {
    // Non-compact format using Intl.NumberFormat
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MUR',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: maximumFractionDigits
    }).format(value).replace('MUR', 'Rs');
  }
}
