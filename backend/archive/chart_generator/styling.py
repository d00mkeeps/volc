from .schemas import CHART_COLORS, ChartConfig


def style_1rm_chart(raw_config: ChartConfig) -> ChartConfig:
    """Applies consistent styling to a chart with time series support."""
    
    # Extract the chart configuration as a dictionary for direct modification
    # This bypasses the Pydantic model limitations
    config_dict = raw_config.model_dump()
    
    # Process datasets
    for idx, dataset in enumerate(config_dict.get('data', {}).get('datasets', [])):
        color = CHART_COLORS[idx % len(CHART_COLORS)]
        
        # Apply basic styling to each dataset
        dataset['borderColor'] = color
        dataset['backgroundColor'] = color
        dataset['fill'] = False
        dataset['tension'] = 0.1
        dataset['pointRadius'] = 2.5
        
        # Special styling for average line
        if dataset.get('label', '').lower().find('average') >= 0:
            dataset['borderDash'] = [5, 5]  # Dashed line for average
            dataset['pointRadius'] = 0     # Remove points for average line
            dataset['borderColor'] = '#ff4d4d'  # Red color
            dataset['backgroundColor'] = '#ff4d4d'
            dataset['borderWidth'] = 2      # Slightly thicker line
            dataset['z'] = 100                    # Higher z value = rendered on top
            dataset['type'] = 'line'
        
        # For bar charts
        if dataset.get('type') == 'bar':
            dataset['backgroundColor'] = color  # Add transparency
            dataset['order'] = 0                 # Higher order value = displayed below
    
    # Ensure options are set up
    if 'options' not in config_dict:
        config_dict['options'] = {}
    
    # Add all our styling to the options
    options = config_dict['options']
    
    # Make sure scales exist
    if 'scales' not in options:
        options['scales'] = {}
    
    # Setup x and y axes
    if 'xAxes' not in options['scales']:
        options['scales']['xAxes'] = [{}]
    
    if 'yAxes' not in options['scales']:
        options['scales']['yAxes'] = [{}]
    
    # Ensure we have at least one axis config
    while len(options['scales']['xAxes']) < 1:
        options['scales']['xAxes'].append({})
    
    while len(options['scales']['yAxes']) < 1:
        options['scales']['yAxes'].append({})
    
    # X-axis gridlines
    options['scales']['xAxes'][0]['gridLines'] = {
        'display': True,
        'color': 'rgba(255, 255, 255, 0.2)',
        'zeroLineColor': 'rgba(255, 255, 255, 0.5)',
        'lineWidth': 0.5,
        'drawBorder': True
    }
    
    # Y-axis gridlines
    options['scales']['yAxes'][0]['gridLines'] = {
        'display': True,
        'color': 'rgba(255, 255, 255, 0.2)',
        'zeroLineColor': 'rgba(255, 255, 255, 0.5)',
        'lineWidth': 0.5,
        'drawBorder': True
    }
    
    # Setup ticks
    if 'ticks' not in options['scales']['xAxes'][0]:
        options['scales']['xAxes'][0]['ticks'] = {}
    
    if 'ticks' not in options['scales']['yAxes'][0]:
        options['scales']['yAxes'][0]['ticks'] = {}
    
    # X-axis tick styling
    options['scales']['xAxes'][0]['ticks']['fontColor'] = '#ffffff'
    options['scales']['xAxes'][0]['ticks']['fontSize'] = 11
    options['scales']['xAxes'][0]['ticks']['padding'] = 5
    
    # Y-axis tick styling
    options['scales']['yAxes'][0]['ticks']['fontColor'] = '#ffffff'
    options['scales']['yAxes'][0]['ticks']['fontSize'] = 11
    options['scales']['yAxes'][0]['ticks']['padding'] = 5
    
    # Title styling
    if 'title' not in options:
        options['title'] = {}
    
    options['title']['display'] = True
    options['title']['fontColor'] = '#ffffff'
    options['title']['fontSize'] = 16
    
    if 'text' not in options['title']:
        options['title']['text'] = 'Progress Over Time'
    
    # Get chart type from title
    chart_title = options['title'].get('text', '').lower()
    
    # Set Y-axis label based on chart type
    y_label = "Estimated 1RM (kg)"  # Default
    
    if 'frequency' in chart_title:
        y_label = "Workouts"
    elif 'volume' in chart_title:
        y_label = "Weekly Volume (kg)"
    
    # Y-axis label
    if 'scaleLabel' not in options['scales']['yAxes'][0]:
        options['scales']['yAxes'][0]['scaleLabel'] = {}
    
    options['scales']['yAxes'][0]['scaleLabel']['display'] = True
    options['scales']['yAxes'][0]['scaleLabel']['labelString'] = y_label
    options['scales']['yAxes'][0]['scaleLabel']['fontColor'] = '#ffffff'
    options['scales']['yAxes'][0]['scaleLabel']['fontSize'] = 14
    
    # Chart-specific settings
    if 'strength' in chart_title or '1rm' in chart_title:
        options['scales']['yAxes'][0]['ticks']['beginAtZero'] = True
        options['scales']['yAxes'][0]['ticks']['stepSize'] = 20
    elif 'volume' in chart_title:
        options['scales']['yAxes'][0]['ticks']['stepSize'] = 500
    
    # Legend styling
    if 'legend' not in options:
        options['legend'] = {}
    
    options['legend']['display'] = True
    options['legend']['position'] = 'bottom'
    
    if 'labels' not in options['legend']:
        options['legend']['labels'] = {}
    
    options['legend']['labels']['fontColor'] = '#ffffff'
    options['legend']['labels']['padding'] = 8
    options['legend']['labels']['boxWidth'] = 12
    options['legend']['labels']['fontSize'] = 11
    options['legend']['labels']['usePointStyle'] = True
    
    # Elements styling
    options['elements'] = {
        'point': {
            'radius': 3,
            'hoverRadius': 5,
            'backgroundColor': 'auto',
            'borderColor': '#ffffff',
            'borderWidth': 1
        },
        'line': {
            'tension': 0.1,
            'borderWidth': 2
        }
    }
    
    # Tooltips
    options['tooltips'] = {
        'mode': 'index',
        'intersect': False,
        'backgroundColor': 'rgba(0, 0, 0, 0.7)',
        'titleFontColor': '#ffffff',
        'bodyFontColor': '#ffffff',
        'bodySpacing': 4,
        'titleMarginBottom': 6,
        'xPadding': 10,
        'yPadding': 10,
        'cornerRadius': 4
    }
    
    # Hover
    options['hover'] = {
        'mode': 'nearest',
        'intersect': True
    }
    
    # Layout
    options['layout'] = {
        'padding': {
            'left': 10,
            'right': 10,
            'top': 10,
            'bottom': 10
        }
    }
    
    # Create a new ChartConfig with our modified dictionary
    styled_config = ChartConfig.model_validate(config_dict)
    
    return styled_config