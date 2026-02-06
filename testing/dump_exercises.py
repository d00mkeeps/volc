import asyncio
import os
import sys
import json

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

async def main():
    try:
        from app.services.cache.exercise_definitions import exercise_cache
        exercises = await exercise_cache.get_all_exercises()
        print(f"Loaded {len(exercises)} exercises")
        
        with open('testing/exercises_dump.json', 'w') as f:
            json.dump(exercises, f, indent=2)
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
