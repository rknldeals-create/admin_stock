import requests
import os
import json

# ----------------------------------------------------------------------
# 1. CONFIGURE TEST PARAMETERS
# ----------------------------------------------------------------------

# --- REQUIRED: Replace with real data from your Supabase 'licenses' table ---
# Ensure this user is VALID (date in the future) in your DB for Test 1
VALID_CLIENT_ID = "TEST_NEW_CLIENT" 
VALID_LICENSE_KEY = "NEW_TEST_KEY_123" 

# An ID/Key that is NOT in your database or is EXPIRED for testing failure
INVALID_CLIENT_ID = "CLIENT_Z999"
INVALID_KEY = "FAKE_KEY_99999" 


# --- API ENDPOINTS ---
# UPDATED: Assuming your license logic is now at app/api/route.js
LOCAL_SERVER_URL = "http://localhost:3001/api"

# Replace this with your actual deployed Vercel domain after deployment!
DEPLOYED_SERVER_URL = "https://your-domain.vercel.app/api"


# ----------------------------------------------------------------------
# 2. LICENSE CHECK FUNCTION
# ----------------------------------------------------------------------

def check_license(url, client_id, license_key):
    """Performs a request to the license server to validate subscription status."""
    
    # Use client_id=None to test the 400 response from the Vercel function
    if client_id is None:
        payload = {"license_key": license_key}
    else:
        payload = {
            "client_id": client_id,
            "license_key": license_key 
        }
    
    print(f"\n--- Checking URL: {url} ---")
    print(f"[info] Testing Client: {client_id}")
    print(f"[info] Request Payload: {json.dumps(payload)}")

    try:
        res = requests.post(
            url, 
            json=payload, 
            timeout=5
        )
        
        print(f"[info] Server responded with status code: {res.status_code}")
        
        # Try to print the server's response content
        try:
            print(f"[info] Server Response Body: {res.json()}")
        except json.JSONDecodeError:
            print(f"[info] Server Response Body: (Could not decode JSON)")

        
        # Match responses from your Vercel/Next.js function
        if res.status_code == 200:
            print("[RESULT] ✅ License validated successfully (Status 200).")
            return True
        elif res.status_code == 403:
            print("[RESULT] ❌ License check failed: Subscription expired or invalid key (Status 403).")
            return False
        elif res.status_code == 400:
            print("[RESULT] ⚠️ Bad Request: Missing input parameters (Status 400).")
            return False
        else:
            print(f"[RESULT] ❓ Unexpected Status: Server returned {res.status_code}.")
            return False

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] ❌ License check failed: Network error contacting server. {e}")
        return False

# ----------------------------------------------------------------------
# 3. RUN TESTS
# ----------------------------------------------------------------------

if __name__ == "__main__":
    
    # ----------------------------------------
    # TEST SUITE A: LOCAL DEVELOPMENT (Must run 'vercel dev' on port 3001)
    # ----------------------------------------
    print("\n\n#####################################################")
    print("## STARTING LOCAL TESTS (Server running on port 3001)##")
    print("#####################################################")
    
    # Test A.1: Valid Key and Client ID (Should return 200)
    print("\n--- TEST A.1: Valid License ---")
    check_license(LOCAL_SERVER_URL, VALID_CLIENT_ID, VALID_LICENSE_KEY)
    
    # Test A.2: Invalid License Key (Should return 403)
    print("\n--- TEST A.2: Invalid Key/Expired Subscription ---")
    check_license(LOCAL_SERVER_URL, VALID_CLIENT_ID, INVALID_KEY)
    
    # Test A.3: Non-existent Client ID (Should return 403)
    print("\n--- TEST A.3: Invalid Client ID ---")
    check_license(LOCAL_SERVER_URL, INVALID_CLIENT_ID, VALID_LICENSE_KEY)
    
    # Test A.4: Missing Client ID (Should return 400 from your Vercel function)
    print("\n--- TEST A.4: Missing Client ID Parameter (Bad Request) ---")
    # Pass None for client_id to simulate missing data in the payload
    check_license(LOCAL_SERVER_URL, None, VALID_LICENSE_KEY)
    
    
    # ----------------------------------------
    # TEST SUITE B: DEPLOYED (Requires DEPLOYED_SERVER_URL to be set)
    # ----------------------------------------
    print("\n\n#########################################################")
    print("## STARTING DEPLOYED TESTS (Check DEPLOYED_SERVER_URL) ##")
    print("#########################################################")
    
    # Test B.1: Valid Key on Deployment (Should return 200)
    print("\n--- TEST B.1: Valid License on Deployment ---")
    check_license(DEPLOYED_SERVER_URL, VALID_CLIENT_ID, VALID_LICENSE_KEY)