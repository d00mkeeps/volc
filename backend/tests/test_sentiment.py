import pytest
import os
import logging
import json
from dotenv import load_dotenv
from typing import Dict, Any, List
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.prompts.chat import MessagesPlaceholder

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@pytest.mark.asyncio
async def test_workout_sentiment_analysis():
    load_dotenv()
    logger = logging.getLogger(__name__)
    logger.info("\nStarting workout sentiment analysis test")
    
    # Validate environment
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        pytest.skip("Missing required environment variables")
    
    # Initialize the LLM
    llm = ChatAnthropic(
        model="claude-3-5-sonnet-20241022",
        api_key=api_key,
        streaming=False  # Important for reliable results
    )
    
    # Create an improved sentiment analysis prompt
    IMPROVED_SENTIMENT_PROMPT = """
    You are analyzing user responses to determine if they're approving or rejecting a workout summary.
    
    Task: Determine if the user's response represents an approval of the workout summary or a rejection/request for changes.
    
    Examples:
    - "Looks good" → APPROVE
    - "Yes that's correct" → APPROVE
    - "Perfect, thanks!" → APPROVE
    - "No changes necessary" → APPROVE
    - "That's right" → APPROVE
    - "Spot on" → APPROVE
    
    - "No, I did more sets" → REJECT
    - "The weight is wrong" → REJECT
    - "Can you change X to Y?" → REJECT
    - "Not quite right" → REJECT
    - "I'm not sure" → REJECT
    - "Missing a workout" → REJECT
    
    Rules:
    1. Respond ONLY with "APPROVE" or "REJECT"
    2. Any request for changes should be a REJECT
    3. Any expression of uncertainty should be a REJECT
    4. Clear confirmations should be APPROVE
    5. "Looks good but..." is a REJECT (partial approval)
    6. If the message contains any corrections, it's a REJECT
    
    Analyze the following user response to a workout summary and determine if they are approving it or requesting changes:
    """
    
    # Create a sentiment analysis chain with the improved prompt
    sentiment_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=IMPROVED_SENTIMENT_PROMPT),
        MessagesPlaceholder(variable_name="messages"),
        HumanMessage(content="{current_message}")
    ]).partial(current_message="")
    
    sentiment_chain = sentiment_prompt | llm
    
    # Create a custom analyzer function that uses this chain directly
    async def improved_analyze_sentiment(message: str, current_summary: Dict, messages: List = None) -> bool:
        sentiment_messages = []
        
        if messages:
            # Use the message context if provided
            sentiment_messages = [
                HumanMessage(content=f"""Last AI Message: {messages[0].content}
User Response: {message}""")
            ]
        else:
            # Fallback to using the summary
            sentiment_messages = [
                HumanMessage(content=f"""Summary: {json.dumps(current_summary, indent=2)}
User's Response: {message}""")
            ]
        
        try:
            # Get raw response for debugging
            result = await sentiment_chain.ainvoke({"messages": sentiment_messages})
            response = result.content.strip()
            logger.info(f"Raw sentiment response: '{response}'")
            return response == "APPROVE"
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return False
    
    # Create sample workout summary
    sample_workout_summary_text = """
    Back & Core Workout
    Exercises:
    1. Face Pulls
       • Set 1: 10 reps at 26.4kg

    2. Hyperextensions
       • Set 1: 8 reps at 45kg
       • Set 2: 10 reps at 45kg
       • Set 3: 12 reps at 45kg

    3. Decline Crunches
       • Set 1: 12 reps at 10kg
       • Set 2: 10 reps at 15kg

    Notes:
    • Chin-ups felt okay but noted preference for pull-ups
    • DB rows were performed on weaker side first
    • Pull-ups performed with focus on lower trap engagement

    Does this look correct?
    """
    
    test_cases = [
        # Clear approvals
        {
            "message": "Looks good",
            "expected_result": True,
            "description": "Simple approval"
        },
        {
            "message": "Yes that's correct",
            "expected_result": True,
            "description": "Confirmation approval"
        },
        {
            "message": "Perfect, thanks!",
            "expected_result": True,
            "description": "Positive approval"
        },
        # Clear rejections
        {
            "message": "No, I did 4 sets of leg raises not 3",
            "expected_result": False,
            "description": "Correction rejection"
        },
        {
            "message": "The weight on decline crunches is wrong",
            "expected_result": False, 
            "description": "Error pointing rejection"
        },
        {
            "message": "Can you change the workout name to Back Day?",
            "expected_result": False,
            "description": "Modification request rejection"
        },
        # Ambiguous responses
        {
            "message": "Looks good but I'm not sure about the notes",
            "expected_result": False,
            "description": "Partial approval (should reject)"
        },
        {
            "message": "Yes... I think so?",
            "expected_result": False,
            "description": "Uncertain approval (should reject)"
        },
        # Edge case from logs
        {
            "message": "No changes necessary...",
            "expected_result": True,  # This should be True, but logs show it was False
            "description": "Confirmation with ellipsis"
        }
    ]
    
    # Create a dictionary summary
    current_summary = {
        "name": "Back & Core Workout",
        "exercises": [
            {
                "exercise_name": "Face Pulls",
                "set_data": {
                    "sets": [{"weight": 26.4, "reps": 10}]
                },
                "order_in_workout": 1,
                "weight_unit": "kg",
                "distance_unit": None
            },
            {
                "exercise_name": "Hyperextensions",
                "set_data": {
                    "sets": [
                        {"weight": 45, "reps": 8},
                        {"weight": 45, "reps": 10},
                        {"weight": 45, "reps": 12}
                    ]
                },
                "order_in_workout": 2,
                "weight_unit": "kg",
                "distance_unit": None
            },
            {
                "exercise_name": "Decline Crunches",
                "set_data": {
                    "sets": [
                        {"weight": 10, "reps": 12},
                        {"weight": 15, "reps": 10}
                    ]
                },
                "order_in_workout": 3,
                "weight_unit": "kg",
                "distance_unit": None
            }
        ],
        "description": [
            "Chin-ups felt okay but noted preference for pull-ups",
            "DB rows were performed on weaker side first",
            "Pull-ups performed with focus on lower trap engagement"
        ]
    }
    
    results = []
    
    # Run all cases even if some fail
    for case in test_cases:
        try:
            logger.info(f"\nTesting sentiment analysis with message: '{case['message']}'")
            
            # Create the message context
            messages = [
                AIMessage(content=sample_workout_summary_text),
                HumanMessage(content=case["message"])
            ]
            
            # Call the improved analyze_sentiment function
            is_approved = await improved_analyze_sentiment(
                case['message'],
                current_summary,
                messages
            )
            
            # Log the result
            status = "✅ PASSED" if is_approved == case["expected_result"] else "❌ FAILED"
            result = {
                "message": case["message"],
                "expected": case["expected_result"],
                "actual": is_approved,
                "status": status,
                "description": case["description"]
            }
            results.append(result)
            
            logger.info(f"Result: {status} - Expected: {case['expected_result']}, Got: {is_approved}")
            
        except Exception as e:
            logger.error(f"Error testing case '{case['message']}': {str(e)}")
    
    # Print summary of results
    logger.info("\n===== SENTIMENT ANALYSIS TEST RESULTS =====")
    for result in results:
        logger.info(f"{result['status']} - {result['description']}: '{result['message']}' → Expected: {result['expected']}, Got: {result['actual']}")
    
    passed = sum(1 for r in results if r["status"] == "✅ PASSED")
    total = len(results)
    logger.info(f"\nPassed {passed}/{total} tests ({passed/total*100:.1f}%)")
    
    # Final assertions to verify results but allow us to see all test outcomes
    failed_cases = [r for r in results if r["status"] == "❌ FAILED"]
    if failed_cases:
        failed_messages = "\n".join([f"- '{r['message']}': Expected {r['expected']}, got {r['actual']}" for r in failed_cases])
        pytest.fail(f"Failed {len(failed_cases)}/{total} test cases:\n{failed_messages}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_workout_sentiment_analysis())