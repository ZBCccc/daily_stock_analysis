/**
 * Shared formatting utilities for portfolio components
 */

/**
 * Format number with locale-specific formatting
 */
export const formatNumber = (num?: number): string => {
  if (num === undefined || num === null) return 'N/A';
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Format percentage with sign
 */
export const formatPercent = (num?: number): string => {
  if (num === undefined || num === null) return 'N/A';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
};

/**
 * Get color class based on value (positive/negative)
 */
export const getChangeColor = (value?: number): string => {
  if (value === undefined || value === null) return 'text-secondary';
  return value >= 0 ? 'text-green-400' : 'text-red-400';
};

/**
 * Format currency with symbol
 */
export const formatCurrency = (num?: number, symbol: string = '¥'): string => {
  if (num === undefined || num === null) return 'N/A';
  return `${symbol}${formatNumber(num)}`;
};
