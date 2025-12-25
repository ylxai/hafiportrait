#!/usr/bin/env python3
"""
Simple Auto Upload Script for Hafi Portrait
Upload photos to event via API
"""

import requests
import os
from pathlib import Path

# Configuration
API_BASE_URL = "https://hafiportrait.photography/api"
API_KEY = "hpk_0734d2bf3a1dc694b71cee1040930d6c86ba8b817e425e3e920505c0d981f231"
EVENT_ID = "f5e06495-c84b-4da0-9085-820adddc4681"  # Sara & Lie event

# Photos directory
PHOTOS_DIR = "/home/eouser/foto"

def upload_photo(file_path, event_id, api_key):
    """
    Upload a single photo to the event
    
    Args:
        file_path: Path to the photo file
        event_id: Event ID to upload to
        api_key: API key for authentication
    
    Returns:
        dict: Response from API
    """
    url = f"{API_BASE_URL}/admin/events/{event_id}/photos/upload"
    
    headers = {
        "x-api-key": api_key
    }
    
    # Open file and upload
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
                    return {'success': True, 'data': result}
                else:
                    print(f"❌ FAILED: {result.get('message', 'Unknown error')}")
                    return {'success': False, 'error': result.get('message')}
            else:
                print(f"❌ HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('error', 'Unknown error')}")
                except:
                    print(f"   Response: {response.text[:100]}")
                return {'success': False, 'error': f"HTTP {response.status_code}"}
                
        except requests.exceptions.Timeout:
            print("❌ TIMEOUT (> 120s)")
            return {'success': False, 'error': 'Timeout'}
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            return {'success': False, 'error': str(e)}

def main():
    """Main upload function"""
    print("="*60)
    print("🚀 Hafi Portrait Auto Upload Script")
    print("="*60)
    print()
    
    # Validate API key
    if API_KEY == "YOUR_API_KEY_HERE":
        print("❌ ERROR: Please set your API key in the script!")
        print("   Edit line 12: API_KEY = \"your-actual-api-key\"")
        return
    
    # Find photos to upload
    photos_dir = Path(PHOTOS_DIR)
    if not photos_dir.exists():
        print(f"❌ ERROR: Directory not found: {PHOTOS_DIR}")
        return
    
    # Get all JPG files
    photo_files = sorted(photos_dir.glob("*.jpg")) + sorted(photos_dir.glob("*.JPG")) + \
                  sorted(photos_dir.glob("*.jpeg")) + sorted(photos_dir.glob("*.JPEG"))
    
    if not photo_files:
        print(f"❌ No photos found in: {PHOTOS_DIR}")
        return
    
    print(f"📁 Found {len(photo_files)} photos in: {PHOTOS_DIR}")
    print(f"🎯 Target event: Sara & Lie")
    print(f"🔑 API Key: {API_KEY[:10]}...")
    print()
    
    # Auto-confirm for batch upload
    print(f"✅ Auto-confirming upload of {len(photo_files)} photos...")
    print("   (To cancel, press Ctrl+C)")
    
    print()
    print("Starting upload...")
    print("-"*60)
    
    # Upload each photo
    results = []
    for i, photo_path in enumerate(photo_files, 1):
        print(f"[{i}/{len(photo_files)}] ", end='')
        result = upload_photo(str(photo_path), EVENT_ID, API_KEY)
        results.append(result)
        
        # Small delay to avoid overwhelming server
        import time
        time.sleep(0.5)
    
    # Summary
    print()
    print("-"*60)
    print("📊 UPLOAD SUMMARY")
    print("-"*60)
    
    success_count = sum(1 for r in results if r['success'])
    failed_count = len(results) - success_count
    
    print(f"✅ Successful: {success_count}/{len(results)}")
    print(f"❌ Failed: {failed_count}/{len(results)}")
    
    if failed_count > 0:
        print()
        print("Failed uploads:")
        for i, (photo, result) in enumerate(zip(photo_files, results)):
            if not result['success']:
                print(f"  - {photo.name}: {result.get('error', 'Unknown error')}")
    
    print()
    print("="*60)
    print("✅ Upload complete!")
    print("="*60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Upload cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
