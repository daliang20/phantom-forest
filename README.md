# Phantom Forest Map Generator and Pathfinder

A Python-based tool for generating, managing, and navigating the Phantom Forest game world. This tool helps players find optimal paths between maps and locate specific mobs while avoiding dangerous areas.

## Features

- **Map Generation**: Create and manage interconnected game maps
- **Mob Tracking**: Find where specific mobs spawn across different maps
- **Smart Pathfinding**: Find optimal paths between maps while avoiding dangerous areas
- **Portal Navigation**: Clear directional guidance using portal coordinates
- **Safety Features**: Automatic avoidance of dangerous areas (e.g., Dead Man's Gorge)

## Directory Structure

```
phantom-forest/
├── maps/              # JSON files for each map
├── mobs/              # JSON files containing mob data
├── map_generator.py   # Map generation and management
├── map_fetcher.py     # Map data retrieval tool
└── phantom_forest.py  # Main pathfinding and navigation system
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Finding Mobs and Paths

```python
from phantom_forest import PhantomForestPathfinder

# Initialize the pathfinder
pathfinder = PhantomForestPathfinder("maps", "mobs")

# Find paths to a specific mob from Bent Tree (610010000)
paths = pathfinder.find_path_to_mob("610010000", "mob_id", find_all=True)

# Display the paths
for path in paths:
    print(format_path(path, pathfinder.maps))
```

### Understanding Portal Directions

The pathfinder provides clear directions for portal locations:

- **Clear Positions**: "top left", "bottom right", etc.
- **Middle Positions**: Shows exact coordinates "(x, y)"
- **Mixed Positions**: "bottom at x:400" or "left at y:300"

### Safety Features

The system automatically avoids dangerous areas like Dead Man's Gorge (map ID: 610010004). This includes:
- Excluding dangerous maps from pathfinding
- Skipping portals that lead to dangerous areas
- Filtering out mobs in dangerous locations

## Map Format

Maps are stored as JSON files with the following structure:

```json
{
    "id": "610010000",
    "name": "Bent Tree",
    "portals": [
        {
            "toMap": "610010001",
            "x": 400,
            "y": 300
        }
    ],
    "mobs": [
        {
            "id": "mob_id",
            "name": "Mob Name"
        }
    ]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
