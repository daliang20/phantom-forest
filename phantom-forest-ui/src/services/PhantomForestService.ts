import { 
    MapMob,
    Portal,
    Path, 
    PathStep, 
    MapData,
    MapsData,
    MobsData, 
    ConsolidatedMob, 
    RawMob
} from '../types/PhantomForest';

class PhantomForestService {
    private maps: MapsData = {};
    private mobs: MobsData = {};
    private consolidatedMobs: ConsolidatedMob[] = [];
    private initialized = false;

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('Initializing PhantomForestService...');
            
            // Fetch maps
            console.log('Fetching maps from:', process.env.PUBLIC_URL + '/maps/maps.json');
            const mapsResponse = await fetch(process.env.PUBLIC_URL + '/maps/maps.json');
            if (!mapsResponse.ok) {
                throw new Error(`Failed to fetch maps: ${mapsResponse.statusText}`);
            }
            const mapsData: MapsData = await mapsResponse.json();
            console.log('Loaded maps:', Object.keys(mapsData).length);
            
            // Log a sample map to check structure
            const sampleMapId = Object.keys(mapsData)[0];
            console.log('Sample map structure:', {
                id: sampleMapId,
                data: mapsData[sampleMapId]
            });
            
            this.maps = mapsData;

            // Fetch mobs
            console.log('Fetching mobs from:', process.env.PUBLIC_URL + '/maps/mobs.json');
            const mobsResponse = await fetch(process.env.PUBLIC_URL + '/maps/mobs.json');
            if (!mobsResponse.ok) {
                throw new Error(`Failed to fetch mobs: ${mobsResponse.statusText}`);
            }
            const mobsData: MobsData = await mobsResponse.json();
            console.log('Loaded mobs:', Object.keys(mobsData).length);
            
            // Log a sample mob to check structure
            const sampleMobId = Object.keys(mobsData)[0];
            console.log('Sample mob structure:', {
                id: sampleMobId,
                data: mobsData[sampleMobId]
            });
            
            this.mobs = mobsData;

            // Consolidate mobs
            this.consolidateMobs();
            console.log('Consolidated mobs:', this.consolidatedMobs.length);
            if (this.consolidatedMobs.length > 0) {
                console.log('Sample consolidated mob:', this.consolidatedMobs[0]);
            }

            this.initialized = true;
        } catch (error) {
            console.error('Error loading data:', error);
            // Re-throw the error to handle it in the component
            throw error;
        }
    }

    private consolidateMobs() {
        const mobsByName: { [name: string]: ConsolidatedMob } = {};
        console.log('Starting mob consolidation...');

        // First, create a lookup of all known mobs
        console.log('Creating mob lookup from', Object.keys(this.mobs).length, 'mobs');
        Object.values(this.mobs).forEach(mob => {
            if (!mobsByName[mob.name]) {
                mobsByName[mob.name] = {
                    id: mob.id.toString(),
                    name: mob.name,
                    locations: []
                };
            }
        });
        console.log('Created lookup for', Object.keys(mobsByName).length, 'unique mob names');

        // Then find all locations for each mob
        console.log('Finding mob locations in', Object.keys(this.maps).length, 'maps');
        Object.entries(this.maps).forEach(([mapId, mapData]) => {
            if (mapData.mobs && Array.isArray(mapData.mobs)) {
                mapData.mobs.forEach(mapMob => {
                    // Get the mob name from the mob data using the ID
                    const mobId = mapMob.id?.toString();
                    const mobName = mobId ? this.mobs[mobId]?.name : undefined;
                    if (mobName && mobsByName[mobName] && !mobsByName[mobName].locations.includes(mapId)) {
                        mobsByName[mobName].locations.push(mapId);
                    }
                });
            }
        });

        this.consolidatedMobs = Object.values(mobsByName)
            .filter(mob => mob.locations.length > 0)  // Only include mobs that appear on the map
            .sort((a, b) => a.name.localeCompare(b.name));  // Sort by name
        
        console.log('Final consolidated mobs:', this.consolidatedMobs.length);
        if (this.consolidatedMobs.length > 0) {
            console.log('Sample mob locations:', {
                name: this.consolidatedMobs[0].name,
                locations: this.consolidatedMobs[0].locations
            });
        }
    }

    private getMinimapUrl(mapId: string): string {
        const mapData = this.maps[mapId];
        if (mapData?.miniMap?.canvas) {
            // Return data URL using the base64 canvas data
            return `data:image/png;base64,${mapData.miniMap.canvas}`;
        }
        // Fallback to API if no canvas data
        return `https://maplestory.io/api/GMS/255/map/${mapId}/minimap`;
    }

    private getMinimapScaling(mapId: string): number {
        const mapData = this.maps[mapId];
        if (mapData?.miniMap?.magnification) {
            // Use the magnification from the map data
            return 1 / mapData.miniMap.magnification;
        }
        // Default scaling factor
        return 0.25;
    }

    private getMobsInMap(mapId: string): { [mobName: string]: number } {
        const mapData = this.maps[mapId];
        if (!mapData?.mobs) return {};

        // Count occurrences of each mob
        return mapData.mobs.reduce((counts: { [mobName: string]: number }, mapMob) => {
            const mobData = this.mobs[mapMob.id];
            if (mobData?.name) {
                counts[mobData.name] = (counts[mobData.name] || 0) + 1;
            }
            return counts;
        }, {});
    }

    private createPathStep(mapId: string, direction: string | null = null, lastPortal?: Portal): PathStep {
        const mapData = this.maps[mapId];
        if (!mapData) throw new Error(`Map ${mapId} not found`);

        return {
            mapId,
            mapName: mapData.name || 'Unknown',
            direction,
            minimapUrl: this.getMinimapUrl(mapId),
            minimap: mapData.miniMap && {
                width: mapData.miniMap.width,
                height: mapData.miniMap.height,
                centerX: mapData.miniMap.centerX,
                centerY: mapData.miniMap.centerY,
                magnification: mapData.miniMap.magnification,
                canvas: mapData.miniMap.canvas,
                vrBounds: mapData.vrBounds && {
                    left: mapData.vrBounds.left,
                    right: mapData.vrBounds.right,
                    top: mapData.vrBounds.top,
                    bottom: mapData.vrBounds.bottom
                }
            },
            portalCoords: lastPortal ? {
                x: lastPortal.x,
                y: lastPortal.y
            } : undefined,
            mobsInMap: this.getMobsInMap(mapId)
        };
    }

    findPathsToMob(startMapId: string, mobName: string): Path[] {
        const paths: Path[] = [];
        const visited = new Set<string>();
        const queue: Array<{ mapId: string; path: PathStep[]; lastPortal?: Portal }> = [];

        // Find all maps where this mob appears
        const targetMaps = this.consolidatedMobs.find(mob => mob.name === mobName)?.locations || [];
        if (targetMaps.length === 0) {
            console.log('No maps found containing mob:', mobName);
            return [];
        }

        // Initialize with start map
        queue.push({
            mapId: startMapId,
            path: [this.createPathStep(startMapId)]
        });

        // Track all paths that contain the target mob
        const allPaths: Path[] = [];

        while (queue.length > 0) {
            const { mapId, path, lastPortal } = queue.shift()!;
            
            if (visited.has(mapId)) continue;
            visited.add(mapId);

            // If we have portal coordinates from the previous map, add them to the current step
            if (lastPortal) {
                const currentStep = path[path.length - 1];
                currentStep.portalCoords = {
                    x: lastPortal.x,
                    y: lastPortal.y
                };
            }

            // Check if current map has the mob
            const mobsInMap = this.getMobsInMap(mapId);
            if (mobName in mobsInMap) {
                allPaths.push({
                    steps: path,
                    mobLocations: [mapId],
                    targetMob: mobName
                });
            }

            // Explore connected maps (but only if path is not too long)
            if (path.length < 8) { // Limit path length to avoid too long routes
                const currentMap = this.maps[mapId];
                if (currentMap?.portals) {
                    for (const portal of currentMap.portals) {
                        const targetMapId = portal.toMap?.toString();
                        const targetMap = this.maps[targetMapId];
                        
                        // Skip invalid portals or portals to unknown maps
                        if (!targetMapId || !targetMap || portal.type === 0 || portal.unknownExit) {
                            continue;
                        }
                        
                        if (!visited.has(targetMapId)) {
                            const direction = this.getPortalDirection(portal.x, portal.y);
                            const newPath = [...path];
                            newPath.push(this.createPathStep(
                                targetMapId,
                                direction,
                                portal
                            ));
                            queue.push({
                                mapId: targetMapId,
                                path: newPath,
                                lastPortal: portal
                            });
                        }
                    }
                }
            }
        }

        // Score paths based on length and mob count
        const pathsWithScore = allPaths.map(path => {
            let totalMobCount = 0;
            let targetMobCount = 0;
            path.steps.forEach(step => {
                if (step.mobsInMap) {
                    Object.entries(step.mobsInMap).forEach(([mob, count]) => {
                        if (mob === mobName) {
                            targetMobCount += count;
                        }
                        totalMobCount += count;
                    });
                }
            });

            // Calculate score prioritizing shorter paths:
            // - Heavily penalize each additional map (-5 points per map)
            // - Give bonus for target mobs (2 points per mob)
            // - Small bonus for other mobs (0.5 points per mob)
            const score = 
                -5 * path.steps.length +          // Path length penalty
                2 * targetMobCount +              // Target mob bonus
                0.5 * (totalMobCount - targetMobCount); // Other mobs small bonus

            return {
                path,
                score,
                length: path.steps.length,
                targetCount: targetMobCount
            };
        });

        // First sort by path length, then by score for paths of same length
        return pathsWithScore
            .sort((a, b) => {
                if (a.length !== b.length) {
                    return a.length - b.length; // Shorter paths first
                }
                return b.score - a.score; // If same length, higher score wins
            })
            .slice(0, 5)
            .map(p => p.path);
    }

    findPathToMultipleMobs(startMapId: string, mobNames: string[]): Path[] {
        if (mobNames.length === 0) return [];
        
        console.log('Finding paths for mobs:', mobNames);
        console.log('Starting from map:', startMapId);
        
        // Get all target maps for each mob
        const mobMaps = new Map<string, string[]>();
        mobNames.forEach(mobName => {
            const locations = this.consolidatedMobs.find(mob => mob.name === mobName)?.locations || [];
            mobMaps.set(mobName, locations);
            console.log(`Mob ${mobName} can be found in maps:`, locations);
        });

        if (mobMaps.size === 0) {
            console.log('No maps found containing any of the mobs');
            return [];
        }

        // Find shortest path between any two maps
        const findShortestPath = (fromMapId: string, toMapId: string): PathStep[] => {
            console.log(`Finding path from ${fromMapId} to ${toMapId}`);
            const visited = new Set<string>();
            const queue: Array<{ mapId: string; path: PathStep[]; lastPortal?: Portal }> = [];
            
            const startMap = this.maps[fromMapId];
            if (!startMap) {
                console.log(`Start map ${fromMapId} not found`);
                return [];
            }

            queue.push({
                mapId: fromMapId,
                path: [this.createPathStep(fromMapId)]
            });

            let searchDepth = 0;
            const maxDepth = 20; // Prevent infinite loops

            while (queue.length > 0 && searchDepth < maxDepth) {
                const { mapId: currentMapId, path, lastPortal } = queue.shift()!;
                searchDepth = path.length;
                
                if (currentMapId === toMapId) {
                    console.log(`Found path to ${toMapId} with ${path.length} steps`);
                    return path;
                }

                if (visited.has(currentMapId)) continue;
                visited.add(currentMapId);

                const currentMap = this.maps[currentMapId];
                if (!currentMap?.portals) {
                    console.log(`No portals found in map ${currentMapId}`);
                    continue;
                }

                console.log(`Exploring portals in map ${currentMapId}:`, currentMap.portals.length);

                for (const portal of currentMap.portals) {
                    const targetMapId = portal.toMap?.toString();
                    
                    // Skip invalid portals or spawn points
                    if (!targetMapId || portal.type === 0 || portal.unknownExit) {
                        continue;
                    }

                    if (!visited.has(targetMapId)) {
                        const targetMap = this.maps[targetMapId];
                        if (!targetMap) {
                            console.log(`Target map ${targetMapId} not found`);
                            continue;
                        }

                        const direction = this.getPortalDirection(portal.x, portal.y);
                        const newPath = [...path];
                        newPath.push(this.createPathStep(
                            targetMapId,
                            direction,
                            portal
                        ));
                        
                        queue.push({
                            mapId: targetMapId,
                            path: newPath,
                            lastPortal: portal
                        });
                    }
                }
            }

            if (searchDepth >= maxDepth) {
                console.log(`Path search exceeded max depth of ${maxDepth}`);
            }

            console.log(`No path found from ${fromMapId} to ${toMapId}`);
            return [];
        };

        // Use a simple greedy algorithm to find a path visiting all mobs
        const result: Path[] = [];
        let currentMapId = startMapId;
        const unvisitedMobs = new Set(mobNames);

        console.log('Starting path search with unvisited mobs:', Array.from(unvisitedMobs));

        while (unvisitedMobs.size > 0) {
            let shortestPath: PathStep[] | null = null;
            let closestMob: string | null = null;
            let closestMapId: string | null = null;

            // Find the closest unvisited mob
            for (const mobName of Array.from(unvisitedMobs)) {
                const mobLocations = mobMaps.get(mobName)!;
                console.log(`Checking locations for mob ${mobName}:`, mobLocations);
                
                for (const mapId of mobLocations) {
                    const path = findShortestPath(currentMapId, mapId);
                    if (path.length > 0 && (!shortestPath || path.length < shortestPath.length)) {
                        shortestPath = path;
                        closestMob = mobName;
                        closestMapId = mapId;
                        console.log(`Found shorter path to ${mobName} in map ${mapId} with ${path.length} steps`);
                    }
                }
            }

            if (!shortestPath || !closestMob || !closestMapId) {
                console.log('Could not find path to remaining mobs:', Array.from(unvisitedMobs));
                break;
            }

            console.log(`Adding path to ${closestMob} in map ${closestMapId}`);
            result.push({
                steps: shortestPath,
                mobLocations: [closestMapId],
                targetMob: closestMob
            });

            currentMapId = closestMapId;
            unvisitedMobs.delete(closestMob);
            console.log('Remaining unvisited mobs:', Array.from(unvisitedMobs));
        }

        console.log('Final path result:', result);
        return result;
    }

    private getPortalDirection(x: number, y: number, mapWidth: number = 800, mapHeight: number = 600): string {
        const leftRegion = mapWidth * 0.3;
        const rightRegion = mapWidth * 0.7;
        const topRegion = mapHeight * 0.3;
        const bottomRegion = mapHeight * 0.7;

        // For portals near the middle, use more precise positioning
        if (leftRegion < x && x < rightRegion && topRegion < y && y < bottomRegion) {
            return `at (${x}, ${y})`;
        }

        // Determine position
        let xPos = x <= leftRegion ? "left" : x >= rightRegion ? "right" : `x:${x}`;
        let yPos = y <= topRegion ? "top" : y >= bottomRegion ? "bottom" : `y:${y}`;

        // Combine positions
        if (xPos.startsWith("x:") && yPos.startsWith("y:")) {
            return `at (${x}, ${y})`;
        } else if (xPos.startsWith("x:")) {
            return `${yPos} at x:${x}`;
        } else if (yPos.startsWith("y:")) {
            return `${xPos} at y:${y}`;
        } else {
            return `${yPos} ${xPos}`;
        }
    }

    getAllMobs(): ConsolidatedMob[] {
        return this.consolidatedMobs;
    }

    getMapName(mapId: string): string {
        return this.maps[mapId]?.name || 'Unknown';
    }
}

export const phantomForestService = new PhantomForestService();

export const getAllMobs = async (): Promise<ConsolidatedMob[]> => {
    await phantomForestService.initialize();
    return phantomForestService.getAllMobs();
};

export const findPathsToMob = async (startMapId: string, mobName: string): Promise<Path[]> => {
    await phantomForestService.initialize();
    return phantomForestService.findPathsToMob(startMapId, mobName);
};

export const findPathToMultipleMobs = async (startMapId: string, mobNames: string[]): Promise<Path[]> => {
    await phantomForestService.initialize();
    return phantomForestService.findPathToMultipleMobs(startMapId, mobNames);
};

export const getMapName = async (mapId: string): Promise<string> => {
    await phantomForestService.initialize();
    return phantomForestService.getMapName(mapId);
};
