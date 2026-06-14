export function getPercentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, (value / total) * 100);
}
