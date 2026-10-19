/**
 * Returns the maturity date for an investment.
 *
 * The investment term determines the maturity month, while maturity is always
 * on the 30th of that month. February is clamped to its last valid day.
 */
export function getMaturityDate(activatedAt: Date | string, durationDays: number): Date {
  const maturity = new Date(activatedAt);
  maturity.setDate(maturity.getDate() + durationDays);

  const year = maturity.getFullYear();
  const month = maturity.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  maturity.setDate(Math.min(30, lastDay));

  return maturity;
}
