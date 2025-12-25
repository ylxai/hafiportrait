#!/usr/bin/env python3
"""
Test upload script - Upload only 2 photos
"""

import requests
import os

# Configuration
API_BASE_URL = "https://hafiportrait.photography/api"
API_KEY = "hpk_0734d2bf3a1dc694b71cee1040930d6c86ba8b817e425e3e920505c0d981f231"
EVENT_ID = "f5e06495-c84b-4da0-9085-820adddc4681"

# Test with 2 photos
TEST_PHOTOS = [
    "/home/eouser/foto/DSC_7697.JPG",
    "/home/eouser/foto/DSC_7699.JPG"
]

def upload_photo(file_path):
    """Upload a single photo"""
    url = f"{API_BASE_URL}/admin/events/{EVENT_ID}/photos/upload"
    
    headers = {
        "x-api-key": API_KEY
    }
    
    with open(file_path, 'rb') as f:
        files = {
            'files': (os.path.basename(file_path), f, 'image/jpeg')
        }
        
        print(f"Uploading: {os.path.basename(file_path)}...", end=' ')
        
        try:
            response = requests.post(url, headers=headers, files=files, timeout=120)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print("✅ SUCCESS!")
                    return True
                else:
                    print(f"❌ FAILED: {result.get('message', 'Unknown')}")
                    return False
            else:
                print(f"❌ HTTP {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False
                
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            return False

print("="*60)
print("🧪 TEST UPLOAD - 2 Photos")
print("="*60)
print()

success_count = 0
for photo in TEST_PHOTOS:
    if upload_photo(photo):
        success_count += 1
    import time
    time.sleep(1)

print()
print("="*60)
print(f"✅ Result: {success_count}/{len(TEST_PHOTOS)} successful")
print("="*60)
