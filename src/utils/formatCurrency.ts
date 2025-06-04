/**
 * Formats a number as currency with the specified locale and currency code
 */
export const formatCurrency = (
  amount: number,
  locale = 'es-BO',
  currencyCode = 'BOB'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formats a number as currency with a + or - sign
 */
export const formatCurrencyWithSign = (
  amount: number,
  locale = 'es-BO',
  currencyCode = 'BOB'
): string => {
  const formatted = formatCurrency(Math.abs(amount), locale, currencyCode);
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
};

/**
 * Extracts a number from a currency string
 */
export const parseCurrencyInput = (input: string): number => {
  // Remove all non-numeric characters except decimal point
  const cleanedInput = input.replace(/[^\d.-]/g, '');
  return parseFloat(cleanedInput) || 0;
};

export default formatCurrency;