"""
Simple test script to verify unified coach components.
Run this to check that all imports and basic functionality work.
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

async def test_imports():
    """Test that all new components can be imported"""
    print("Testing imports...")
    
    try:
        from app.services.context.shared_context_loader import SharedContextLoader
        print("✅ SharedContextLoader imported")
        
        from app.services.llm.tool_selector import ToolSelector
        print("✅ ToolSelector imported")
        
        from app.core.prompts.unified_coach import get_unified_coach_prompt
        print("✅ Unified coach prompt imported")
        
        from app.services.llm.unified_coach_service import UnifiedCoachService
        print("✅ UnifiedCoachService imported")
        
        print("\n✅ All imports successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Import failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_prompt():
    """Test that prompt can be loaded and has placeholders"""
    print("\nTesting unified prompt...")
    
    try:
        from app.core.prompts.unified_coach import get_unified_coach_prompt
        
        prompt = get_unified_coach_prompt()
        
        # Check for expected placeholders
        required_placeholders = [
            "{user_profile}",
            "{ai_memory}",
            "{workout_history}",
            "{available_exercises}"
        ]
        
        for placeholder in required_placeholders:
            if placeholder in prompt:
                print(f"✅ Found placeholder: {placeholder}")
            else:
                print(f"❌ Missing placeholder: {placeholder}")
                return False
        
        print(f"\n📝 Prompt length: {len(prompt)} characters")
        print("✅ Prompt structure valid!")
        return True
        
    except Exception as e:
        print(f"\n❌ Prompt test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run all tests"""
    print("=" * 60)
    print("UNIFIED COACH SYSTEM - COMPONENT TESTS")
    print("=" * 60)
    
    tests = [
        test_imports,
        test_prompt
    ]
    
    results = []
    for test in tests:
        result = await test()
        results.append(result)
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️ {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
