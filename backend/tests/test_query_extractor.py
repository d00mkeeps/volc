from app.services.extraction.query_extractor import QueryExtractor, ExerciseQuery
from langchain_core.messages import HumanMessage
import pytest

@pytest.mark.asyncio
async def test_query_extractor():
    # Initialize extractor
    extractor = QueryExtractor()
    
    # Test cases: (input_message, expected_output)
    standard_test_cases = [
        # Case 1: Simple query with timeframe
        (
            "Show me my bench press and squats from the last 3 months",
            ExerciseQuery(
                exercises=["bench press", "squats"],
                timeframe="3 months"
            )
        ),
        # Case 2: Multiple exercises without timeframe (should use default)
        (
            "How are my deadlifts and overhead press progressing?",
            ExerciseQuery(
                exercises=["deadlifts", "overhead press"],
                timeframe="3 months"
            )
        ),
        # Case 3: Single exercise with specific timeframe
        (
            "Check my bench press progress over the past year",
            ExerciseQuery(
                exercises=["bench press"],
                timeframe="12 months"
            )
        ),
    ]

    # Run standard test cases
    print("\nTesting standard query cases:")
    for test_input, expected_output in standard_test_cases:
        print(f"\nTesting input: {test_input}")
        
        # Convert input to message format
        messages = [HumanMessage(content=test_input)]
        
        # Get extraction result
        result = await extractor.extract(messages)
        
        print(f"Expected output: {expected_output}")
        print(f"Actual output: {result}")
        
        # Assertions
        assert result is not None
        assert isinstance(result, ExerciseQuery)
        assert sorted(result.exercises) == sorted(expected_output.exercises)
        assert result.timeframe == expected_output.timeframe

    print("\nAll standard test cases passed successfully!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_query_extractor())