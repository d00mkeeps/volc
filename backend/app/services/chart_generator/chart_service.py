from urllib.parse import urlencode

from app.services.chart_generator.styling import style_1rm_chart

from .schemas import (
    ChartStyle,
    ChartConfig,
    QuickChartConfig
)

from quickchart import QuickChart
from typing import Optional
from urllib.parse import urlencode

class ChartService:
    def __init__(self):
        self.chart_style = ChartStyle()
        self.base_url = "https://quickchart.io/chart"
        
    def create_chart_url(self, config: ChartConfig, use_short_url: bool = False) -> str:
        """
        Creates a URL for the chart configuration.
        Args:
            config: The chart configuration
            use_short_url: Whether to generate a short URL (slower but more reliable for sharing)
        """
        styled_config = style_1rm_chart(config)
        full_config = QuickChartConfig(
            style=self.chart_style,
            config=styled_config
        )
        
        if use_short_url:
            return self._generate_short_url(full_config)
        
        url = self._generate_url(full_config)
        if len(url) > 2048:  # Common browser URL length limit
            return self._generate_short_url(full_config)
            
        return url

    def _generate_url(self, config: QuickChartConfig) -> str:
        """Generates a standard QuickChart URL."""
        params = {
            'c': config.config.model_dump_json(),
            'w': config.style.width,
            'h': config.style.height,
            'bkg': config.style.background_color,
            'devicePixelRatio': config.style.device_pixel_ratio,
            'f': config.style.format,
        }
        return f"{self.base_url}?{urlencode(params)}"

    def _generate_short_url(self, config: QuickChartConfig) -> str:
        """
        Generates a short URL using QuickChart's API.
        Note: This makes an API call and is slower than generating a regular URL.
        """
        qc = QuickChart()
        qc.width = config.style.width
        qc.height = config.style.height
        qc.background_color = config.style.background_color
        qc.device_pixel_ratio = config.style.device_pixel_ratio
        qc.config = config.config.model_dump()
        
        return qc.get_short_url()