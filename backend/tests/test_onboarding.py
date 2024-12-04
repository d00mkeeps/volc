import asyncio
import logging
import json
from app.services.onboarding_chain import OnboardingChain

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def run_test_case(test_number: int, summary_text: str) -> bool:
    logger.info(f"\n=== Running Test Case {test_number} ===")
    logger.debug(f"Input text:\n{summary_text}")
    
    chain = OnboardingChain()
    chain._check_for_summary(summary_text)
    
    success = chain.current_summary is not None
    if success:
        logger.info(f"✅ Test {test_number} passed!")
        logger.debug(f"Validated summary:\n{json.dumps(chain.current_summary, indent=2)}")
    else:
        logger.error(f"❌ Test {test_number} failed!")
    return success

async def test_summary_parsing():
    test_cases = [
        # Test 1: Original happy path
        """Personal Information:
First Name: John
Last Name: Doe
Age Group: 25-35
Preferred Units: metric

Goal: Increase strength by 20% over 3 months through progressive overload

Fitness Background:
Training Age: Intermediate
Exercise Preferences: powerlifting, cardio, yoga
Current Abilities: bench 100kg, squat 140kg, deadlift 180kg
Injuries: minor lower back strain""",

        # Test 2: Multiple injuries
        """Personal Information:
First Name: Sarah
Last Name: Smith
Age Group: 30-40
Preferred Units: metric

Goal: Complete first marathon in 6 months

Fitness Background:
Training Age: Beginner
Exercise Preferences: running, swimming
Current Abilities: 5k in 30 minutes
Injuries: right knee pain, previous ankle sprain""",

        # Test 3: No injuries
        """Personal Information:
First Name: Mike
Last Name: Johnson
Age Group: 20-25
Preferred Units: imperial

Goal: Build muscle mass over 12 weeks

Fitness Background:
Training Age: Advanced
Exercise Preferences: bodybuilding, calisthenics
Current Abilities: 225lb bench, 315lb squat
Injuries: none reported""",

        # Test 4: Different formatting
        """Personal Information:
First Name: Alex
Last Name:  Brown  
Age Group:   18-25 
Preferred Units:metric

Goal: Improve flexibility and mobility over 2 months

Fitness Background:
Training Age:Novice
Exercise Preferences:yoga,pilates,stretching
Current Abilities:basic poses,10 minute plank
Injuries:tight hamstrings,lower back stiffness"""
    ]

    results = []
    for i, test_case in enumerate(test_cases, 1):
        result = await run_test_case(i, test_case)
        results.append(result)

    # Summary
    logger.info("\n=== Test Summary ===")
    total_passed = sum(results)
    logger.info(f"Total Tests: {len(results)}")
    logger.info(f"Passed: {total_passed}")
    logger.info(f"Failed: {len(results) - total_passed}")

if __name__ == "__main__":
    asyncio.run(test_summary_parsing())