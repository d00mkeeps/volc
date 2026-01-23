import asyncio
from app.services.cache.exercise_definitions import exercise_cache

async def run():
    await exercise_cache.refresh()
    exes = await exercise_cache.get_all_exercises()
    mobility = [e for e in exes if e.get('base_movement') == 'mobility']
    print(f'Found {len(mobility)} mobility exercises')
    for e in mobility[:10]:
        print(f' - {e.get("standard_name")} (Muscles: {e.get("primary_muscles")})')

if __name__ == "__main__":
    asyncio.run(run())
