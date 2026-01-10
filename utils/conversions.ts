/**
 * Convert weight to metric (kg) for database storage
 */
export const toMetricWeight = (weight: number, isImperial: boolean): number => {
  if (isImperial) {
    return weight * 0.453592; // lbs to kg
  }
  return weight;
};

/**
 * Convert weight from metric (kg) to user's preferred units
 */
export const fromMetricWeight = (
  weightKg: number,
  isImperial: boolean
): number => {
  if (isImperial) {
    return weightKg / 0.453592; // kg to lbs
  }
  return weightKg;
};

/**
 * Round to 2 decimal places
 */
export const roundWeight = (weight: number): number => {
  return Math.round(weight * 100) / 100;
};
