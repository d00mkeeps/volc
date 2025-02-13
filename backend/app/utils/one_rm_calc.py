from typing import Optional
import math

class OneRMCalculator:
    @staticmethod
    def _epley_formula(weight: float, reps: int) -> float:
        return weight * (1 + 0.0333 * reps)

    @staticmethod
    def _brzycki_formula(weight: float, reps: int) -> float:
        return weight * (36 / (37 - reps))

    @staticmethod
    def _lombardi_formula(weight: float, reps: int) -> float:
        return weight * (reps ** 0.10)

    @staticmethod
    def _mayhew_formula(weight: float, reps: int) -> float:
        return weight / (0.522 + 0.419 * math.exp(-0.055 * reps))

    @classmethod
    def calculate(cls, weight: float, reps: int) -> Optional[float]:
        if weight <= 0 or reps <= 0:
            return None

        try:
            mayhew_1rm = cls._mayhew_formula(weight, reps)

            if reps <= 4:
                second_1rm = cls._epley_formula(weight, reps)
            elif reps <= 15:
                second_1rm = cls._brzycki_formula(weight, reps)
            else:
                second_1rm = cls._lombardi_formula(weight, reps)

            # Round to 2 decimal places
            return round((mayhew_1rm + second_1rm) / 2, 2)

        except Exception as e:
            print(f"Error calculating 1RM: {e}")
            return None