#!/usr/bin/env python3

import json
import os
from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass
from collections import deque
import logging

logging.basicConfig(level=logging.INFO)

def get_portal_direction(x: int, y: int, map_width: int = 800, map_height: int = 600) -> str:
    """Determine the direction of a portal based on its position"""
    # Define regions
    left_region = map_width * 0.3
    right_region = map_width * 0.7
    top_region = map_height * 0.3
    bottom_region = map_height * 0.7

    # For portals near the middle, use more precise positioning
    if left_region < x < right_region and top_region < y < bottom_region:
        return f"at ({x}, {y})"

    # Determine position
    if x <= left_region:
        x_pos = "left"
    elif x >= right_region:
        x_pos = "right"
    else:
        x_pos = f"x:{x}"

    if y <= top_region:
        y_pos = "top"
    elif y >= bottom_region:
        y_pos = "bottom"
    else:
        y_pos = f"y:{y}"

    # Combine positions
    if x_pos.startswith("x:") and y_pos.startswith("y:"):
        return f"at ({x}, {y})"
    elif x_pos.startswith("x:"):
        return f"{y_pos} at x:{x}"
    elif y_pos.startswith("y:"):
        return f"{x_pos} at y:{y}"
    else:
        return f"{y_pos} {x_pos}"

@dataclass
class Portal:
    target_map: str
    direction: str
    x: int
    y: int

@dataclass
class MapNode:
    id: str
    name: str
    mobs: Set[str]
    connections: Dict[str, Tuple['MapNode', Portal]]  # target_map_id -> (MapNode, Portal)

@dataclass
class Path:
    steps: List[Tuple[str, Optional[str]]]  # List of (map_id, direction)
    mob_locations: List[str]  # List of map IDs where the mob appears

class PhantomForestPathfinder:
    def __init__(self, maps_dir: str, mobs_dir: str):
        self.maps_dir = maps_dir
        self.mobs_dir = mobs_dir
        self.maps: Dict[str, MapNode] = {}
        self.mob_locations: Dict[str, Set[str]] = {}  # mob_id -> set of map_ids
        self.forbidden_maps = {"610010004"}  # Dead Man's Gorge
        self.load_data()

    def load_data(self):
        """Load map and mob data from JSON files"""
        # Load mob data first to build mob location mapping
        for mob_file in os.listdir(self.mobs_dir):
            if mob_file.endswith('.json'):
                with open(os.path.join(self.mobs_dir, mob_file), 'r') as f:
                    mob_data = json.load(f)
                    mob_id = str(mob_data['id'])
                    self.mob_locations[mob_id] = set()

        # Load map data and build connections
        for map_file in os.listdir(self.maps_dir):
            if map_file.endswith('.json'):
                map_id = map_file.replace('.json', '')
                if map_id in self.forbidden_maps:
                    continue  # Skip forbidden maps
                with open(os.path.join(self.maps_dir, map_file), 'r') as f:
                    map_data = json.load(f)
                    
                    # Create map node
                    self.maps[map_id] = MapNode(
                        id=map_id,
                        name=map_data.get('name', ''),
                        mobs=set(),
                        connections={}
                    )
                    
                    # Record mob locations
                    for mob in map_data.get('mobs', []):
                        mob_id = str(mob['id'])
                        self.maps[map_id].mobs.add(mob_id)
                        if mob_id in self.mob_locations:
                            self.mob_locations[mob_id].add(map_id)

        # Build connections after all maps are loaded
        for map_id, node in self.maps.items():
            with open(os.path.join(self.maps_dir, f"{map_id}.json"), 'r') as f:
                map_data = json.load(f)
                for portal in map_data.get('portals', []):
                    target_map = str(portal.get('toMap', ''))
                    # Skip connections to forbidden maps
                    if target_map in self.maps and target_map not in self.forbidden_maps:
                        direction = get_portal_direction(portal.get('x', 0), portal.get('y', 0))
                        portal_obj = Portal(
                            target_map=target_map,
                            direction=direction,
                            x=portal.get('x', 0),
                            y=portal.get('y', 0)
                        )
                        node.connections[target_map] = (self.maps[target_map], portal_obj)

    def find_mob_locations(self, mob_id: str) -> Set[str]:
        """Find all maps where a mob appears"""
        locations = self.mob_locations.get(str(mob_id), set())
        # Filter out forbidden maps
        return {loc for loc in locations if loc not in self.forbidden_maps}

    def find_path_to_mob(self, start_map_id: str, mob_id: str, find_all: bool = False) -> List[Path]:
        """Find path(s) from start map to a map containing the target mob"""
        mob_maps = self.find_mob_locations(mob_id)
        if not mob_maps:
            return []

        paths = []
        visited = set()
        queue = deque([(start_map_id, [(start_map_id, None)])])
        
        while queue:
            current_map_id, current_path = queue.popleft()
            
            if current_map_id in mob_maps:
                paths.append(Path(steps=current_path, mob_locations=[current_map_id]))
                if not find_all:
                    break
                
            current_node = self.maps[current_map_id]
            for next_map_id, (next_node, portal) in current_node.connections.items():
                if next_map_id not in visited:
                    visited.add(next_map_id)
                    new_path = current_path + [(next_map_id, portal.direction)]
                    queue.append((next_map_id, new_path))
        
        return paths

def format_path(path: Path, maps: Dict[str, MapNode]) -> str:
    """Format a path into a readable string"""
    result = ["Path to mob:"]
    for i, (map_id, direction) in enumerate(path.steps):
        map_name = maps[map_id].name
        if i < len(path.steps) - 1:
            direction_text = f" → {direction}" if direction else ""
        else:
            direction_text = " (destination)"
        result.append(f"{i+1}. {map_name} ({map_id}){direction_text}")
    return "\n".join(result)

def main():
    pathfinder = PhantomForestPathfinder("maps", "mobs")
    
    # List available mobs
    print("Available mobs:")
    for mob_file in os.listdir(pathfinder.mobs_dir):
        if mob_file.endswith('.json'):
            with open(os.path.join(pathfinder.mobs_dir, mob_file), 'r') as f:
                mob_data = json.load(f)
                print(f"{mob_data['id']}: {mob_data.get('name', 'Unknown')}")
    
    while True:
        mob_id = input("\nEnter mob ID to search (or 'quit' to exit): ").strip()
        if mob_id.lower() == 'quit':
            break
            
        start_map = "610010000"  # Bent Tree
        paths = pathfinder.find_path_to_mob(start_map, mob_id, find_all=True)
        
        if not paths:
            print(f"No paths found to mob {mob_id}")
            continue
            
        print(f"\nFound {len(paths)} path(s) to mob {mob_id}:")
        for i, path in enumerate(paths, 1):
            print(f"\nPath {i}:")
            print(format_path(path, pathfinder.maps))

if __name__ == "__main__":
    main()
