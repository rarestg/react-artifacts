const trimDecimal = (value: number, decimals: number) => {
  const fixed = value.toFixed(decimals);
  if (decimals === 0) return fixed;
  return fixed.replace(/\.0+$/, '');
};

export const formatCompactNumber = (value: number): string => {
  if (value < 1000) return `${value}`;
  if (value < 10_000) {
    return `${trimDecimal(value / 1000, 1)}k`;
  }
  if (value < 1_000_000) {
    const roundedThousands = Math.round(value / 1000);
    if (roundedThousands >= 1000) {
      return `${trimDecimal(value / 1_000_000, 1)}m`;
    }
    return `${roundedThousands}k`;
  }
  return `${trimDecimal(value / 1_000_000, 1)}m`;
};
