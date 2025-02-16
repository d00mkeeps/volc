'''
This function takes our styled QuickChartConfig and generates a valid URL for the QuickChart API.
It combines the chart styling parameters and Chart.js configuration into a properly encoded URL.

Note: If URLs get too long, we may need to handle that with short URLs or chunking.
'''

from urllib.parse import urlencode, quote

from app.services.chart_generator.schemas import QuickChartConfig

def generate_quickchart_url(chart_config: QuickChartConfig) -> str:
    """Generates a QuickChart URL from a styled configuration."""
    
    # Base URL for QuickChart API
    base_url = "https://quickchart.io/chart"
    
    # Convert config to parameters
    params = {
        'c': chart_config.config.json(),  # Chart.js configuration
        'w': chart_config.style.width,
        'h': chart_config.style.height,
        'bkg': chart_config.style.background_color,
        'devicePixelRatio': chart_config.style.device_pixel_ratio,
        'f': chart_config.style.format,
    }
    
    # Generate URL with proper encoding
    url = f"{base_url}?{urlencode(params)}"
    
    return url