#!/usr/bin/env python3

import requests
import json
import os

# List of mob IDs to fetch
MOB_IDS = [9601331, 9601332, 9601264, 9601263]

def fetch_mob_data(mob_id):
    """Fetch mob data from MapleStory.io API"""
    url = f"https://maplestory.io/api/gms/255/mob/{mob_id}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to fetch data for mob {mob_id}: {response.status_code}")
        return None

def main():
    # Create mobs directory if it doesn't exist
    if not os.path.exists("mobs"):
        os.makedirs("mobs")

    for mob_id in MOB_IDS:
        print(f"Fetching data for mob {mob_id}...")
        mob_data = fetch_mob_data(mob_id)
        
        if mob_data:
            # Save to file
            output_file = f"mobs/{mob_id}.json"
            with open(output_file, 'w') as f:
                json.dump(mob_data, f, indent=2)
            print(f"Saved data to {output_file}")

if __name__ == "__main__":
    main()
