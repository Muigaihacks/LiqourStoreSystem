import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_customer_registration():
    print("Testing Customer Registration...")
    
    # 1. Success case
    payload = {
        "name": "Test User",
        "phone_number": "0712345678",
        "email": "test@example.com"
    }
    try:
        response = requests.post(f"{BASE_URL}/customers/register/", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("SUCCESS: Customer registered.")
        elif response.status_code == 400 and "already registered" in response.text:
             print("SUCCESS: Validated duplicate correctly.")
        else:
            print("FAILURE: Unexpected response.")
            
    except Exception as e:
        print(f"ERROR: {e}")

    # 2. Duplicate case
    print("\nTesting Duplicate Registration...")
    try:
        response = requests.post(f"{BASE_URL}/customers/register/", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_customer_registration()
