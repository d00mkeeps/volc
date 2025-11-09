/**
 * Calculate 1RM using Epley formula
 */
function epleyFormula(weight: number, reps: number): number {
  return weight * (1 + 0.0333 * reps);
}

/**
 * Calculate 1RM using Brzycki formula
 */
function brzyckiFormula(weight: number, reps: number): number {
  return weight * (36 / (37 - reps));
}

/**
 * Calculate 1RM using Lombardi formula
 */
function lombardiFormula(weight: number, reps: number): number {
  return weight * Math.pow(reps, 0.1);
}

/**
 * Calculate 1RM using Mayhew formula
 */
function mayhewFormula(weight: number, reps: number): number {
  return weight / (0.522 + 0.419 * Math.exp(-0.055 * reps));
}

/**
 * Calculate estimated 1RM by averaging Mayhew formula with a second formula
 * based on rep range
 *
 * @param weight - Weight lifted
 * @param reps - Number of reps performed
 * @returns Estimated 1RM, or null if invalid inputs
 */
export function calculate1RM(weight: number, reps: number): number | null {
  if (weight <= 0 || reps <= 0) {
    return null;
  }

  try {
    const mayhew1RM = mayhewFormula(weight, reps);

    let second1RM: number;
    if (reps <= 4) {
      second1RM = epleyFormula(weight, reps);
    } else if (reps <= 15) {
      second1RM = brzyckiFormula(weight, reps);
    } else {
      second1RM = lombardiFormula(weight, reps);
    }

    // Average the two formulas and round to 2 decimal places
    return Math.round(((mayhew1RM + second1RM) / 2) * 100) / 100;
  } catch (error) {
    console.error("Error calculating 1RM:", error);
    return null;
  }
}
