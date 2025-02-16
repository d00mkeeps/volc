from datetime import datetime, timedelta
from pprint import pprint

from app.services.chart_generator.chart_service import ChartService
from app.services.chart_generator.schemas import ChartConfig, ChartData, Dataset


def test_chart_generation():
    # Create sample dates (6 points, spaced 2 weeks apart)
    dates = [
        (datetime.now() - timedelta(days=x)).strftime('%d-%m-%Y') 
        for x in [70, 56, 42, 28, 14, 0]  # Going back about 10 weeks
    ]

    # Sample data for 6 exercises (with realistic progressive overload)
    test_data = {
        "Bench Press": [100, 102.5, 105, 105, 107.5, 110],
        "Squat": [140, 145, 147.5, 150, 152.5, 155],
        "Deadlift": [160, 165, 170, 172.5, 175, 177.5],
        "Overhead Press": [60, 62.5, 65, 65, 67.5, 67.5],
        "Barbell Row": [90, 92.5, 95, 97.5, 97.5, 100],
        "Front Squat": [110, 115, 117.5, 120, 122.5, 125]
    }

    # Create test config
    test_config = ChartConfig(
        type="line",
        data=ChartData(
            labels=dates,
            datasets=[
                Dataset(label=exercise, data=values)
                for exercise, values in test_data.items()
            ]
        ),
        options={}
    )

    # Initialize service and generate URL
    service = ChartService()
    url = service.create_chart_url(test_config)

    print("\nGenerated Chart URL:")
    print(url)

    print("\nChart Configuration:")
    pprint(test_config.model_dump())

    # Basic assertions
    assert url is not None
    assert isinstance(url, str)
    assert url.startswith('https://quickchart.io/chart')
    assert 'Bench+Press' in url
    assert 'Squat' in url
    # Also, let's update the deprecated Pydantic methods:
    print("\nChart Configuration:")
    pprint(test_config.model_dump())  # Changed from .dict()