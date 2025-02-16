'''
These schemas define the structure for a 1RM progress chart:

ChartStyle: Handles the chart image properties like size and format
Dataset: Represents one exercise's 1RM data over time 
ChartData: Combines multiple datasets with their date labels
ChartConfig: The full Chart.js configuration for a line chart
QuickChartConfig: Combines style and chart config for the complete visualization

The CHART_COLORS and DEFAULT_OPTIONS provide consistent styling and formatting.
'''

from typing import List, Optional
from pydantic import BaseModel, Field

CHART_COLORS = [
    "#4ade80",  # light green
    "#60a5fa",  # light blue
    "#a78bfa",  # violet
    "#fb923c",  # light orange
    "#f472b6",  # pink
    "#facc15",  # yellow
]

DEFAULT_OPTIONS = {
    "responsive": True,
    "title": {
        "display": True,
        "text": "1RM Progress Over Time",
        "color": "#fff",
        "font": {
            "size": 16
        }
    },
    "legend": {
        "display": True,
        "labels": {
            "color": "#fff",
            "padding": 10  # Reduced padding
        },
        "position": "bottom"
    },
    "scales": {
        "xAxes": [{
            "display": True,
            "scaleLabel": {
                "display": True,
                "labelString": "Date",
                "color": "#fff",
                "padding": 5  # Added smaller padding
            },
            "gridLines": {
                "color": "#999"
            },
            "ticks": {
                "color": "#fff",
                "padding": 5  # Added smaller padding
            }
        }],
        "yAxes": [{
            "display": True,
            "scaleLabel": {
                "display": True,
                "labelString": "Estimated 1RM (kg)",
                "color": "#fff",
                "padding": 5  # Added smaller padding
            },
            "gridLines": {
                "color": "#999"
            },
            "ticks": {
                "color": "#fff",
                "padding": 5  # Added smaller padding
            }
        }]
    },
    "layout": {
        "padding": {
            "left": 10,
            "right": 10,
            "top": 10,
            "bottom": 10
        }
    }
}
class ChartStyle(BaseModel):
   width: int = Field(default=400)
   height: int = Field(default=350)
   background_color: str = Field(default="#222")
   device_pixel_ratio: float = Field(default=2.0)
   format: str = Field(default="png")

class Dataset(BaseModel):
    """Single dataset configuration"""
    label: str
    data: List[float]
    borderColor: Optional[str] = None
    backgroundColor: Optional[str] = None
    fill: Optional[bool] = None
    tension: Optional[float] = None
    pointRadius: Optional[float] = None

# Rest of schemas remain the same

class ChartData(BaseModel):
   labels: List[str]  # Dates
   datasets: List[Dataset]

class ChartConfig(BaseModel):
   type: str = "line"
   data: ChartData
   options: dict = Field(default_factory=lambda: DEFAULT_OPTIONS)

class QuickChartConfig(BaseModel):
   style: ChartStyle
   config: ChartConfig