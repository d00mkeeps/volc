'''
This helper function takes a basic ChartConfig and applies consistent styling:
- Applies colors from CHART_COLORS to each dataset
- Ensures line chart properties are consistent (point size, line tension, etc.)
- Maintains standard options for titles, legends, and axes
- Returns a fully styled ChartConfig ready for URL generation

This way the LLM only needs to focus on the data structure, not styling.
'''

from app.services.chart_generator.schemas import CHART_COLORS, DEFAULT_OPTIONS, ChartConfig


def style_1rm_chart(raw_config: ChartConfig) -> ChartConfig:
    """Applies consistent styling to a 1RM time series chart."""
    
    # Apply colors and line properties to each dataset
    for idx, dataset in enumerate(raw_config.data.datasets):
        color = CHART_COLORS[idx % len(CHART_COLORS)]
        dataset.borderColor = color
        dataset.backgroundColor = color
        dataset.fill = False
        dataset.tension = 0.1
        dataset.pointRadius = 4

    # Ensure default options are applied
    raw_config.options = {**DEFAULT_OPTIONS, **raw_config.options}
    
    return raw_config