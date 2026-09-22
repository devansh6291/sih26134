import numpy as np
from typing import List

class PredictiveEngine:
    @staticmethod
    def forecast_curve(base_frequency: int, growth_rate: float, months: int = 6) -> List[float]:
        x = np.arange(1, months + 1)
        projections = base_frequency * (1 + growth_rate) ** (x / 2.0)
        return [round(float(val), 2) for val in projections]