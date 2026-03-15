import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_inventory_fetch():
    print("Testing Inventory Fetch...")
    try:
        response = requests.get(f"{BASE_URL}/inventory/")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            # print(json.dumps(data, indent=2))
            print(f"Count: {data.get('count')}")
            results = data.get('results', [])
            print(f"Items: {len(results)}")
            if results:
                print(f"First item: {results[0]}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"EXCEPTION: {e}")

def test_products_fetch():
    print("\nTesting Products Fetch...")
    try:
        response = requests.get(f"{BASE_URL}/products/")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Count: {data.get('count')}")
            print(f"Items: {len(data.get('results', []))}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    test_inventory_fetch()
    test_products_fetch()
