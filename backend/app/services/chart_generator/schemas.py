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
        "fontColor": "#fff",  # v2 uses fontColor instead of color
        "fontSize": 16
    },
    "legend": {
        "display": True,
        "position": "bottom",
        "labels": {
            "fontColor": "#fff",
            "padding": 8,
            "boxWidth": 12,
            "fontSize": 11,
            "usePointStyle": True
        }
    },
    "scales": {
        "xAxes": [{  # v2 uses arrays for axes
            "display": True,
            "scaleLabel": {  # v2 uses scaleLabel
                "display": True,
                "labelString": "Date",  # v2 uses labelString
                "fontColor": "#fff",
                "padding": 5
            },
            "gridLines": {  # v2 uses gridLines
                "color": "#999"
            },
            "ticks": {
                "fontColor": "#fff",
                "padding": 5
            }
        }],
        "yAxes": [{
            "display": True,
            "scaleLabel": {
                "display": True,
                "labelString": "Estimated 1RM (kg)",
                "fontColor": "#fff",
                "padding": 5
            },
            "gridLines": {
                "color": "#999"
            },
            "ticks": {
                "fontColor": "#fff",
                "padding": 5
            }
        }]
    },
    "layout": {
        "padding": {
            "left": 10,
            "right": 10,
            "top": 10,
            "bottom": 20
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