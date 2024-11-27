#!/usr/bin/env python3

import json

# List of map IDs we're interested in
MAP_IDS = [
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

def print_minimap_info():
    """Print miniMap field from maps.json for specified maps"""
    with open('maps/maps.json', 'r') as f:
        maps_data = json.load(f)
        
    for map_id in MAP_IDS:
        map_id_str = str(map_id)
        if map_id_str in maps_data:
            map_info = maps_data[map_id_str]
            print(f"\nMap {map_id} ({map_info.get('name', 'Unknown')})")
            if 'miniMap' in map_info:
                print("miniMap data:")
                print(json.dumps(map_info['miniMap'], indent=2))
            else:
                print("No miniMap data found")
        else:
            print(f"\nMap {map_id} not found in maps.json")

if __name__ == "__main__":
    print_minimap_info()
