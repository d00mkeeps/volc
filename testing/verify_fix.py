import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

async def main():
    from app.tools.exercise_tool import get_strength_exercises
    
    print("\n--- Testing 'back' search ---")
    # Call ainvoke since it's a LangChain tool
    results = await get_strength_exercises.ainvoke({"muscle_groups": ["back"]})
    
    found_row = [ex for ex in results if "Cable Seated Cable Row" in ex.get('standard_name')]
    
    if found_row:
        print(f"✅ SUCCESS: Found Cable Seated Cable Row when searching for 'back'")
        for ex in found_row:
            print(f"   Details: {ex}")
    else:
        print(f"❌ FAILURE: Cable Seated Cable Row not found for 'back'")
        print(f"   Found {len(results)} exercises. Sample names: {[r.get('standard_name') for r in results[:5]]}")

    print("\n--- Testing Equipment Filter Removal ---")
    # Even if passing equipment=['barbell'], we should see the cable row now because filter is disabled
    results_with_eq = await get_strength_exercises.ainvoke({
        "muscle_groups": ["back"], 
        "equipment": ["barbell"]
    })
    found_row_eq = [ex for ex in results_with_eq if "Cable Seated Cable Row" in ex.get('standard_name')]
    
    if found_row_eq:
        print(f"✅ SUCCESS: Found Cable Seated Cable Row even when 'barbell' filter was requested (Filter disabled)")
    else:
        print(f"❌ FAILURE: Equipment filter might still be active")

if __name__ == "__main__":
    asyncio.run(main())
