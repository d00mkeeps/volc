
import asyncio
import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

async def verify_profile_fix():
    from app.services.db.user_profile_service import UserProfileService
    
    # Use a test user ID - ideally one that exists, but admin fetch might work even if empty if we just want to see the query structure (though we can't see query structure easily).
    # We need a user that actually exists to get data back.
    # The previous script used "test_user_memory_direct".
    # Let's try to use a user ID that might exist or just check if the code runs without error.
    # Actually, to verify the fix, we need to see if 'ai_memory' is in the returned dict.
    # If the user doesn't exist, we can't check the returned dict keys.
    # But if we create a user, we can.
    
    print(f"=== Verifying UserProfileService Fix ===")
    profile_service = UserProfileService()
    
    # 1. Get ANY existing user profile
    print("Fetching an existing user profile...")
    try:
        # We can't easily list all users via this service, but we can try to find one.
        # Or we can just try to get the profile for the user ID we saw in the logs earlier if it was real?
        # No, that was a test ID.
        # Let's try to query the table directly using the admin client to get one ID.
        
        response = profile_service.get_admin_client().table('user_profiles').select('auth_user_uuid').limit(1).execute()
        
        if not response.data:
            print("⚠️ No user profiles found in database. Cannot verify fix without a user.")
            return
            
        user_id = response.data[0]['auth_user_uuid']
        print(f"Found existing user: {user_id}")
        
        # 2. Fetch profile using get_user_profile_admin (the function I fixed)
        print("Fetching profile via get_user_profile_admin...")
        result = await profile_service.get_user_profile_admin(user_id)
        
        if result.get("success"):
            data = result["data"]
            print(f"✓ Fetch successful")
            
            # 3. Verify ai_memory is present (even if None)
            if "ai_memory" in data:
                print(f"✅ SUCCESS: 'ai_memory' field is present in response!")
                print(f"  Value: {json.dumps(data['ai_memory'])}")
            else:
                print("❌ FAILURE: 'ai_memory' field is MISSING from response!")
                print(f"  Keys found: {list(data.keys())}")
        else:
            print(f"❌ Failed to fetch profile: {result.get('error')}")
            
    except Exception as e:
        print(f"❌ Error during verification: {e}")

if __name__ == "__main__":
    asyncio.run(verify_profile_fix())
