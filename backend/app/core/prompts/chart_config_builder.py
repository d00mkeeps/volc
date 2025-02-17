CHART_CONFIG_PROMPT = """Based on the following workout data, generate a chart configuration for visualization:

QUERY: {original_query}
DATE RANGE: {all_dates[0]} to {all_dates[-1]}
AVAILABLE DATA: {exercise_summaries}

CREATE A CHART CONFIGURATION WITH:
1. title: A clear descriptive title that addresses the user's query
2. datasets: An array of exercise datasets where each dataset contains:
   - label: The exercise name
   - data: An array of numeric 1RM values (no null values allowed)
3. labels: An array of date strings matching the data points

REQUIREMENTS:
- Only include exercises and data points relevant to the query
- Filter out any null/missing values
- Ensure data points align with their corresponding labels
- All numeric values must be valid numbers

Example structure:
{{
    "title": "Bench Press Progress - Last 3 Months",
    "datasets": [
        {{
            "label": "Bench Press",
            "data": [100.5, 102.0, 105.5]
        }}
    ],
    "labels": ["01-01-2024", "15-01-2024", "30-01-2024"]
}}

Generate a valid ChartConfiguration using the available exercise data."""