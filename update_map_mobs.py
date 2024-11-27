#!/usr/bin/env python3

import json
import os

# Krakian Spirit mob IDs
KRAKIAN_SPIRIT_IDS = [9601331, 9601332, 9601264, 9601263]

# Maps where Phantom Trees appear (and thus where Krakian Spirits should spawn)
SPAWN_MAPS = [
    610010001,
    610010003,
    610010200,
    610010201,
    610010202,
    610010005,
    610010012,
    610010013,
    610010100,
    610010101,
    610010102,
    610010103,
    610010104
]

def update_map_mobs():
    """Add Krakian Spirit mobs to maps where Phantom Trees appear"""
    for map_id in SPAWN_MAPS:
        file_path = f"maps/{map_id}.json"
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                map_data = json.load(f)
            
            # Get existing mobs or create empty list
            if 'mobs' not in map_data:
                map_data['mobs'] = []
            
            # Check if Krakian Spirits are already in the mob list
            existing_mob_ids = {mob['id'] for mob in map_data['mobs']}
            
            # Add each Krakian Spirit if not already present
            added = False
            for spirit_id in KRAKIAN_SPIRIT_IDS:
                if spirit_id not in existing_mob_ids:
                    # Load the mob data from maps directory
                    mob_file_path = f"maps/{spirit_id}.json"
                    if os.path.exists(mob_file_path):
                        with open(mob_file_path, 'r') as f:
                            spirit_data = json.load(f)
                        
                        map_data['mobs'].append({
                            "id": spirit_id,
                            "spawnAfter": 0,  # Instant spawn
                            "total": 1  # At least one of each type
                        })
                        added = True
                    else:
                        print(f"Warning: Mob file not found for {spirit_id}")
            
            if added:
                # Save updated map data
                with open(file_path, 'w') as f:
                    json.dump(map_data, f, indent=2)
                print(f"Added Krakian Spirits to map {map_id}")
            else:
                print(f"Map {map_id} already has Krakian Spirits")
        else:
            print(f"Warning: Map file not found for {map_id}")

if __name__ == "__main__":
    update_map_mobs()
