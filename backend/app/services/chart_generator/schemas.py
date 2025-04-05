'''
These schemas define the structure for chart visualizations:

ChartStyle: Handles the chart image properties like size and format
DataPoint: An x/y coordinate for time series data
Dataset: Represents data series with support for both arrays and time series
ChartData: Combines datasets and optional labels
ChartConfig: The full Chart.js configuration 
QuickChartConfig: Combines style and chart config for the complete visualization

The CHART_COLORS and DEFAULT_OPTIONS provide consistent styling and formatting.
'''

from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field, field_validator

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
        "fontColor": "#ffffff",
        "fontSize": 16
    },
    "legend": {
        "display": True,
        "position": "bottom",
        "labels": {
            "fontColor": "#ffffff",
            "padding": 8,
            "boxWidth": 12,
            "fontSize": 11,
            "usePointStyle": True
        }
    },
    "scales": {
        "xAxes": [{
            "display": True,
            "scaleLabel": {
                "display": True,
                "labelString": "Date",
                "fontColor": "#ffffff",
                "fontSize": 12,
                "padding": 5
            },
            "gridLines": {
                "display": True,
                "color": "rgba(255, 255, 255, 0.2)",
                "zeroLineColor": "rgba(255, 255, 255, 0.4)",
                "drawBorder": True,
                "lineWidth": 0.5,
                "zeroLineWidth": 1,
                "drawOnChartArea": True
            },
            "ticks": {
                "fontColor": "#ffffff",
                "padding": 5,
                "maxRotation": 45,
                "minRotation": 45
            }
        }],
        "yAxes": [{
            "display": True,
            "scaleLabel": {
                "display": True,
                "labelString": "Estimated 1RM (kg)",
                "fontColor": "#ffffff",
                "fontSize": 14,
                "padding": 10
            },
            "gridLines": {
                "display": True,
                "color": "rgba(255, 255, 255, 0.2)",
                "zeroLineColor": "rgba(255, 255, 255, 0.4)",
                "drawBorder": True,
                "lineWidth": 0.5,
                "zeroLineWidth": 1,
                "drawOnChartArea": True
            },
            "ticks": {
                "fontColor": "#ffffff",
                "padding": 8,
                "beginAtZero": False
            }
        }]
    },
    "layout": {
        "padding": {
            "left": 15,
            "right": 15,
            "top": 15,
            "bottom": 15
        }
    },
    "tooltips": {
        "mode": "index",
        "intersect": False,
        "backgroundColor": "rgba(0, 0, 0, 0.7)",
        "titleFontColor": "#ffffff",
        "bodyFontColor": "#ffffff",
        "bodySpacing": 4,
        "titleMarginBottom": 6,
        "xPadding": 10,
        "yPadding": 10,
        "cornerRadius": 4
    },
    "hover": {
        "mode": "nearest",
        "intersect": True
    },
    "elements": {
        "line": {
            "tension": 0.1,
            "borderWidth": 2,
            "fill": False
        },
        "point": {
            "radius": 3,
            "hoverRadius": 5,
            "borderWidth": 1,
            "hoverBorderWidth": 2
        }
    }
}

class ChartStyle(BaseModel):
    """Chart styling properties"""
    width: int = Field(default=400)
    height: int = Field(default=350)
    background_color: str = Field(default="#222")
    device_pixel_ratio: float = Field(default=2.0)
    format: str = Field(default="png")


class DataPoint(BaseModel):
    """Time series data point with x/y coordinates"""
    x: str  # Date in ISO format (e.g. '2025-01-15')
    y: float  # Value for this data point


class Dataset(BaseModel):
    """Single dataset configuration supporting both formats"""
    label: str
    data: Union[List[float], List[DataPoint], List[Dict[str, Any]]]  # Better support for all formats
    borderColor: Optional[str] = None
    backgroundColor: Optional[str] = None
    fill: Optional[bool] = None
    tension: Optional[float] = None
    pointRadius: Optional[float] = None
    type: Optional[str] = None  # For mixed chart types
    
    @field_validator('data')
    def validate_data(cls, v):
        """Ensure data is either all floats or all DataPoints"""
        # Allow empty lists
        if not v:
            return v
            
        # Check if the first element is a dict (for DataPoint)
        if isinstance(v[0], dict):
            # Convert all items to proper DataPoints
            return [DataPoint(x=item['x'], y=item['y']) for item in v]
        # Otherwise assume it's a list of floats
        return v


class ChartData(BaseModel):
    """
    Chart data structure supporting both traditional and time series formats
    """
    datasets: List[Dataset]
    labels: Optional[List[str]] = None  # Optional for time series charts


class ChartConfig(BaseModel):
    """Full chart configuration"""
    type: str = "line"
    data: ChartData
    options: Dict[str, Any] = Field(default_factory=lambda: DEFAULT_OPTIONS)


class QuickChartConfig(BaseModel):
    """Complete configuration for QuickChart API"""
    style: ChartStyle
    config: ChartConfig