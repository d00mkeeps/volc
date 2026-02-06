import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

async def main():
    from app.services.cache.exercise_definitions import exercise_cache
    exercises = await exercise_cache.get_all_exercises()
    
    query = "cable seated row"
    found = [ex for ex in exercises if query in ex.get('standard_name', '').lower()]
    
    if not found:
        print(f"❌ No exercise found matching '{query}'")
        # List some names to see what's available
        print("\nSome available back exercises:")
        back_ex = [ex.get('standard_name') for ex in exercises if 'back' in [m.lower() for m in ex.get('primary_muscles', [])]][:10]
        for name in back_ex:
            print(f"- {name}")
    else:
        for ex in found:
            print(f"✅ Found: {ex['standard_name']}")
            print(f"   ID: {ex['id']}")
            print(f"   Primary Muscles: {ex.get('primary_muscles')}")
            print(f"   Equipment: {ex.get('equipment')}")
            print(f"   Movement Pattern: {ex.get('movement_pattern')}")

if __name__ == "__main__":
    asyncio.run(main())
