import json
from urllib.parse import urlencode

from pydantic import ConfigDict
from app.services.chart_generator.styling import style_1rm_chart
from .schemas import (
    DEFAULT_OPTIONS,
    ChartStyle,
    ChartConfig,
    QuickChartConfig
)
from quickchart import QuickChart
class ChartService:
    def __init__(self):
        self.chart_style = ChartStyle()
        self.base_url = "https://quickchart.io/chart"
        
    def create_quickchart_url(self, config: dict, use_short_url: bool = False) -> str:
        """Creates a URL for the chart configuration."""
        # Extract title and update options
        chart_options = DEFAULT_OPTIONS.copy()
        
        # Set title if provided
        if "title" in config:
            chart_options["title"]["text"] = config["title"]
        
        # Merge chart-specific options if provided
        if "options" in config:
            # Deep merge options
            self._deep_merge_options(chart_options, config["options"])
        
        # Pass the datasets directly - don't try to convert the data format
        chart_data = {"datasets": config["datasets"]}
        
        # Add labels only if provided (not needed for time series)
        if "labels" in config:
            chart_data["labels"] = config["labels"]
        
        # Create ChartConfig - bypassing validation or allowing both formats
        chart_config = ChartConfig(
            type=config.get("type", "line"),
            data=chart_data,
            options=chart_options
        )
        
        # Apply styling
        styled_config = style_1rm_chart(chart_config)
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
    def _deep_merge_options(self, target, source):
        """Recursively merge options dictionaries."""
        for key, value in source.items():
            if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                self._deep_merge_options(target[key], value)
            else:
                target[key] = value
 
    def _generate_url(self, config: QuickChartConfig) -> str:
        """Generates a standard QuickChart URL."""
        import json
        
        # Convert config to dict first, then to JSON
        config_dict = config.config.model_dump()
        
        params = {
            'c': json.dumps(config_dict),  # Use json.dumps on the dict, not the class
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