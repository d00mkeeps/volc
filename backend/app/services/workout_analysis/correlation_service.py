# # app/services/correlation/correlation_service.py
# import numpy as np
# import pandas as pd
# from scipy import stats
# import matplotlib.pyplot as plt
# import seaborn as sns
# import io
# import base64
# from typing import Dict, List, Any, Optional, Tuple
# from datetime import datetime
# import logging

# logger = logging.getLogger(__name__)

# class CorrelationService:
#     def __init__(self, max_lag=4):
#         self.max_lag = max_lag  # Maximum weeks to lag
        
#     def _prepare_exercise_data(self, workout_data):
#         """Extract exercise data and organize by definition ID or exercise name"""
#         exercise_data = {}
        
#         for workout in workout_data.get('workouts', []):
#             workout_date = workout.get('date')
#             for exercise in workout.get('exercises', []):
#                 # Use definition_id as key if available, else use name
#                 definition_id = exercise.get('definition_id')
#                 name = exercise.get('exercise_name', '').lower()
                
#                 # Create a stable key for grouping
#                 key = str(definition_id) if definition_id else name
                
#                 highest_1rm = exercise.get('metrics', {}).get('highest_1rm')
                
#                 if not key or highest_1rm is None or highest_1rm <= 0:
#                     continue
                
#                 if key not in exercise_data:
#                     exercise_data[key] = {
#                         'display_name': name,
#                         'data_points': []
#                     }
                
#                 exercise_data[key]['data_points'].append((workout_date, highest_1rm))
        
#         # Sort by date
#         for key in exercise_data:
#             exercise_data[key]['data_points'].sort(key=lambda x: x[0])
            
#         # Convert to format expected by the rest of the correlation service
#         result = {}
#         for key, data in exercise_data.items():
#             result[key] = data['data_points']
            
#         return result

#     def _convert_to_weekly_series(self, data_points):
#         """Convert date-value tuples to weekly time series"""
#         if not data_points:
#             return pd.Series()
            
#         df = pd.DataFrame(data_points, columns=['date', 'value'])
#         df['date'] = pd.to_datetime(df['date'])
#         df = df.set_index('date')
        
#         return df.resample('W').max()['value']

#     def spearman_correlation(self, series1, series2):
#         """Calculate Spearman rank correlation"""
#         s1, s2 = series1.align(series2, join='inner')
        
#         if len(s1) < 3:  # Need at least 3 points
#             return 0.0, 1.0
            
#         return stats.spearmanr(s1, s2)

#     def time_lagged_correlation(self, series1, series2):
#         """Calculate correlation with time lags"""
#         results = []
        
#         for lag in range(self.max_lag + 1):
#             if lag == 0:
#                 corr, p_value = self.spearman_correlation(series1, series2)
#             else:
#                 corr, p_value = self.spearman_correlation(series1, series2.shift(-lag))
                
#             results.append({
#                 'lag': lag,
#                 'correlation': corr,
#                 'p_value': p_value,
#                 'significant': p_value < 0.05 and abs(corr) > 0.5
#             })
            
#         return results

#     def analyze_exercise_correlations(self, workout_data):
#         """Main analysis method returning correlation data"""
#         try:
#             exercise_data = self._prepare_exercise_data(workout_data)
            
#             # Convert to weekly series
#             weekly_series = {}
#             for name, data in exercise_data.items():
#                 series = self._convert_to_weekly_series(data)
#                 if not series.empty and len(series) >= 3:  # Need at least 3 points
#                     weekly_series[name] = series
            
#             # If fewer than 2 exercises with sufficient data, return empty results
#             if len(weekly_series) < 2:
#                 return {'summary': [], 'heatmap_base64': None, 'time_series': {}}
            
#             correlation_summary = []
#             correlation_matrix = {}
#             time_series_data = {}
            
#             exercises = list(weekly_series.keys())
#             for i, ex1 in enumerate(exercises):
#                 correlation_matrix[ex1] = {}
#                 for j, ex2 in enumerate(exercises):
#                     if i >= j:  # Skip self-correlations and duplicates
#                         continue
                        
#                     # Calculate lag results
#                     lag_results = self.time_lagged_correlation(weekly_series[ex1], weekly_series[ex2])
#                     strongest = max(lag_results, key=lambda x: abs(x['correlation']))
                    
#                     # Store in matrix
#                     correlation_matrix[ex1][ex2] = strongest
#                     if ex2 not in correlation_matrix:
#                         correlation_matrix[ex2] = {}
#                     correlation_matrix[ex2][ex1] = strongest
                    
#                     # Add to summary if significant
#                     if strongest['significant']:
#                         correlation_summary.append({
#                             'exercise1': ex1,
#                             'exercise2': ex2,
#                             'correlation': strongest['correlation'],
#                             'optimal_lag_weeks': strongest['lag'],
#                             'p_value': strongest['p_value'],
#                             'significant': True
#                         })
                    
#                     # Always add time series data for frontend visualization
#                     pair_key = f"{ex1}_{ex2}".lower().replace(' ', '_')
#                     s1, s2 = weekly_series[ex1].align(weekly_series[ex2], join='outer')
                    
#                     time_series_data[pair_key] = {
#                         'exercise1': ex1,
#                         'exercise2': ex2,
#                         'dates': s1.index.strftime('%Y-%m-%d').tolist(),
#                         'exercise1_values': s1.fillna(float('nan')).tolist(),
#                         'exercise2_values': s2.fillna(float('nan')).tolist(),
#                         'correlation': strongest['correlation'],
#                         'lag_weeks': strongest['lag'],
#                         'significant': strongest['significant']
#                     }
            
#             # Generate heatmap if we have correlations
#             heatmap_base64 = None
#             if correlation_matrix and len(exercises) > 1:
#                 heatmap_base64 = self.generate_heatmap(correlation_matrix, exercises)
            
#             return {
#                 'summary': correlation_summary,
#                 'heatmap_base64': heatmap_base64,
#                 'time_series': time_series_data
#             }
            
#         except Exception as e:
#             logger.error(f"Error in correlation analysis: {str(e)}", exc_info=True)
#             return {'summary': [], 'heatmap_base64': None, 'time_series': {}}
            
#     def generate_heatmap(self, correlation_matrix, exercises):
#         """Generate correlation heatmap visualization"""
#         try:
#             matrix_data = []
#             lag_annotations = []
            
#             # Create correlation matrix data
#             for ex1 in exercises:
#                 row = []
#                 lag_row = []
#                 for ex2 in exercises:
#                     if ex1 == ex2:
#                         row.append(1.0)  # Self-correlation is always 1.0
#                         lag_row.append("")
#                     else:
#                         corr_data = correlation_matrix.get(ex1, {}).get(ex2)
#                         if corr_data:
#                             row.append(corr_data['correlation'])
#                             lag_row.append(f"{corr_data['lag']}w" if corr_data['lag'] > 0 else "")
#                         else:
#                             row.append(0.0)
#                             lag_row.append("")
#                 matrix_data.append(row)
#                 lag_annotations.append(lag_row)
                    
#             df = pd.DataFrame(matrix_data, index=exercises, columns=exercises)
            
#             # Create plot
#             plt.figure(figsize=(10, 8))
            
#             # Choose colormap
#             cmap = sns.diverging_palette(220, 10, as_cmap=True)
            
#             # Create heatmap
#             ax = sns.heatmap(
#                 df, 
#                 cmap=cmap, 
#                 vmax=1.0, 
#                 vmin=-1.0, 
#                 center=0, 
#                 square=True, 
#                 linewidths=.5,
#                 cbar_kws={"shrink": .5}, 
#                 annot=True, 
#                 fmt=".2f"
#             )
            
#             # Add lag annotations on correlations above threshold
#             for i in range(len(exercises)):
#                 for j in range(len(exercises)):
#                     if i != j and abs(matrix_data[i][j]) > 0.3:
#                         ax.text(j + 0.5, i + 0.85, lag_annotations[i][j],
#                                 ha="center", va="center", color="black",
#                                 fontsize=8)
            
#             plt.title('Exercise Correlation Heatmap')
#             plt.tight_layout()
            
#             # Convert plot to base64 image
#             buf = io.BytesIO()
#             plt.savefig(buf, format='png', dpi=100)
#             buf.seek(0)
#             img_str = base64.b64encode(buf.read()).decode('utf-8')
#             plt.close()
            
#             return img_str
            
#         except Exception as e:
#             logger.error(f"Error generating heatmap: {str(e)}", exc_info=True)
#             return None