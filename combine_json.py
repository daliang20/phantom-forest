import json
import os

def combine_json_files(input_dir: str, output_file: str):
    combined_data = {}
    
    # Read all JSON files in the directory
    for filename in os.listdir(input_dir):
        if filename.endswith('.json'):
            file_path = os.path.join(input_dir, filename)
            map_id = filename.replace('.json', '')
            
            with open(file_path, 'r') as f:
                data = json.load(f)
                combined_data[map_id] = data
    
    # Write combined data to output file
    with open(output_file, 'w') as f:
        json.dump(combined_data, f, indent=2)

# Combine maps
combine_json_files('maps', 'phantom-forest-ui/public/maps/maps.json')

# Combine mobs
combine_json_files('mobs', 'phantom-forest-ui/public/maps/mobs.json')
