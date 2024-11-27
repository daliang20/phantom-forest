#!/usr/bin/env python3

import json
import os

# Phantom Tree spawn locations
PHANTOM_TREE_LOCATIONS = [
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

# Krakian Spirit mob IDs
KRAKIAN_SPIRIT_IDS = [9601331, 9601332, 9601264, 9601263]

def update_mob_locations():
    """Update Krakian Spirit mob files with Phantom Tree spawn locations"""
    for mob_id in KRAKIAN_SPIRIT_IDS:
        file_path = f"mobs/{mob_id}.json"
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                mob_data = json.load(f)
            
            # Update foundAt locations
            mob_data['foundAt'] = PHANTOM_TREE_LOCATIONS
            
            # Save updated data
            with open(file_path, 'w') as f:
                json.dump(mob_data, f, indent=2)
            print(f"Updated spawn locations for mob {mob_id}")
        else:
            print(f"Warning: File not found for mob {mob_id}")

if __name__ == "__main__":
    update_mob_locations()
