import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, List, Any
import logging
from ..schemas import CorrelationCalculatorResult, SignificantCorrelation

logger = logging.getLogger(__name__)

class CorrelationCalculator:
    """Calculates sophisticated time-lagged correlations between exercises."""
    
    def __init__(self, max_lag=4):
        self.max_lag = max_lag  # Maximum weeks to lag
    
    @staticmethod
    def calculate(strength_time_series: Dict[str, List], volume_time_series: Dict[str, List]) -> CorrelationCalculatorResult:
        """Calculate significant correlations from strength and volume time series."""
        try:
            calc = CorrelationCalculator()
            
            # Combine all time series data
            all_time_series = {**strength_time_series, **volume_time_series}
            
            if len(all_time_series) < 2:
                return CorrelationCalculatorResult(
                    significant_correlations=[],
                    total_pairs_analyzed=0,
                    significant_count=0,
                    data_quality_notes=["Insufficient exercises for correlation analysis"]
                )
            
            # Convert to weekly series
            weekly_series, data_quality_notes = calc._convert_all_to_weekly_series(all_time_series)
            
            if len(weekly_series) < 2:
                return CorrelationCalculatorResult(
                    significant_correlations=[],
                    total_pairs_analyzed=0,
                    significant_count=0,
                    data_quality_notes=data_quality_notes + ["Insufficient weekly data for correlation analysis"]
                )
            
            # Analyze all pairs
            significant_correlations, total_pairs = calc._analyze_all_pairs(weekly_series)
            
            logger.info(f"Found {len(significant_correlations)} significant correlations out of {total_pairs} pairs analyzed")
            
            return CorrelationCalculatorResult(
                significant_correlations=significant_correlations,
                total_pairs_analyzed=total_pairs,
                significant_count=len(significant_correlations),
                data_quality_notes=data_quality_notes
            )
            
        except Exception as e:
            logger.error(f"Error calculating correlations: {e}")
            return CorrelationCalculatorResult(
                significant_correlations=[],
                total_pairs_analyzed=0,
                significant_count=0,
                data_quality_notes=[f"Correlation analysis failed: {str(e)}"]
            )
    
    def _convert_all_to_weekly_series(self, all_time_series: Dict) -> tuple[Dict[str, pd.Series], List[str]]:
        """Convert all time series to weekly pandas series."""
        weekly_series = {}
        notes = []
        
        for factor_name, data_points in all_time_series.items():
            if not data_points:
                notes.append(f"No data points for {factor_name}")
                continue
                
            try:
                # Convert to DataFrame
                df_data = []
                for point in data_points:
                    date = pd.to_datetime(point.date)
                    value = point.highest_1rm if hasattr(point, 'highest_1rm') and point.highest_1rm else point.total_volume
                    df_data.append({'date': date, 'value': value})
                
                if not df_data:
                    notes.append(f"No valid data points for {factor_name}")
                    continue
                
                df = pd.DataFrame(df_data)
                df = df.set_index('date')
                
                # Resample to weekly (take max value per week)
                weekly_series_data = df.resample('W').max()['value']
                
                # Filter out weeks with no data and require minimum data points
                weekly_series_data = weekly_series_data.dropna()
                
                if len(weekly_series_data) >= 4:  # Need at least 4 weeks
                    weekly_series[factor_name] = weekly_series_data
                else:
                    notes.append(f"Insufficient weekly data for {factor_name} ({len(weekly_series_data)} weeks, need 4+)")
                    
            except Exception as e:
                notes.append(f"Failed to process {factor_name}: {str(e)}")
                continue
        
        return weekly_series, notes
    
    def _analyze_all_pairs(self, weekly_series: Dict[str, pd.Series]) -> tuple[List[SignificantCorrelation], int]:
        """Analyze all exercise pairs for significant correlations."""
        significant_correlations = []
        total_pairs = 0
        
        factors = list(weekly_series.keys())
        
        for i, factor1 in enumerate(factors):
            for j, factor2 in enumerate(factors):
                if i >= j:  # Skip self-correlations and duplicates
                    continue
                
                total_pairs += 1
                
                # Calculate time-lagged correlation
                lag_results = self._time_lagged_correlation(weekly_series[factor1], weekly_series[factor2])
                
                # Find strongest correlation
                strongest = max(lag_results, key=lambda x: abs(x['correlation']))
                
                # Check if significant
                if strongest['significant']:
                    # Determine which is outcome vs predictor (favor strength outcomes)
                    outcome, predictor = self._determine_outcome_predictor(factor1, factor2, strongest)
                    
                    correlation = SignificantCorrelation(
                        outcome=outcome,
                        predictor=predictor,
                        strength=self._categorize_strength(abs(strongest['correlation'])),
                        direction="positive" if strongest['correlation'] > 0 else "negative",
                        lag_weeks=strongest['lag'],
                        summary=self._build_summary(outcome, predictor, strongest)
                    )
                    
                    significant_correlations.append(correlation)
        
        return significant_correlations, total_pairs
    
    def _time_lagged_correlation(self, series1: pd.Series, series2: pd.Series) -> List[Dict]:
        """Calculate correlation with time lags (adapted from original service)."""
        results = []
        
        for lag in range(self.max_lag + 1):
            if lag == 0:
                corr, p_value = self._spearman_correlation(series1, series2)
            else:
                corr, p_value = self._spearman_correlation(series1, series2.shift(-lag))
            
            results.append({
                'lag': lag,
                'correlation': corr,
                'p_value': p_value,
                'significant': p_value < 0.05 and abs(corr) > 0.5
            })
        
        return results
    
    def _spearman_correlation(self, series1: pd.Series, series2: pd.Series) -> tuple[float, float]:
        """Calculate Spearman rank correlation (adapted from original service)."""
        s1, s2 = series1.align(series2, join='inner')
        
        if len(s1) < 3:  # Need at least 3 points
            return 0.0, 1.0
        
        return stats.spearmanr(s1, s2)
    
    def _determine_outcome_predictor(self, factor1: str, factor2: str, strongest: Dict) -> tuple[str, str]:
        """Determine which factor is outcome vs predictor (favor strength outcomes)."""
        # If one is strength and one is volume, strength is the outcome
        if "strength" in factor1 and "volume" in factor2:
            return factor1, factor2
        elif "strength" in factor2 and "volume" in factor1:
            return factor2, factor1
        else:
            # For same type pairs, use the direction that makes sense with lag
            if strongest['lag'] > 0:
                # factor1 predicts factor2 after lag
                return factor2, factor1
            else:
                # Simultaneous correlation, just pick consistently
                return factor1, factor2
    
    def _categorize_strength(self, correlation: float) -> str:
        """Categorize correlation strength."""
        if correlation >= 0.7:
            return "strong"
        else:
            return "moderate"  # We already filtered for > 0.5
    
    def _build_summary(self, outcome: str, predictor: str, strongest: Dict) -> str:
        """Build human-readable summary."""
        direction_word = "increases" if strongest['correlation'] > 0 else "decreases"
        lag_text = f" after {strongest['lag']} weeks" if strongest['lag'] > 0 else ""
        
        return f"{predictor} predicts {outcome} {direction_word}{lag_text}"