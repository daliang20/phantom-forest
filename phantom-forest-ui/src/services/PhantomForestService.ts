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
        return `https://maplestory.io/api/GMS/255/map/${mapId}/minimap`;
    }

    private getMinimapScaling(mapId: string): number {
        // Default scaling factor - can be adjusted based on map size
        const defaultScale = 0.25; // 1/4 of original size
        return defaultScale;
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
        console.log('Found mob in maps:', targetMaps);

        // Initialize with start map
        const startMap = this.maps[startMapId];
        if (!startMap) {
            console.log('Start map not found:', startMapId);
            return [];
        }

        // Find the spawn portal (type 0) for the first map
        const findSpawnPortal = (portals: any[]) => {
            return portals.find(p => p.type === 0);
        };

        queue.push({
            mapId: startMapId,
            path: [{
                mapId: startMapId,
                mapName: startMap.name || 'Unknown',
                direction: null,
                minimapUrl: this.getMinimapUrl(startMapId),
                minimap: startMap.miniMap && {
                    width: startMap.miniMap.width,
                    height: startMap.miniMap.height,
                    centerX: startMap.miniMap.centerX,
                    centerY: startMap.miniMap.centerY,
                    vrBounds: startMap.vrBounds && {
                        left: startMap.vrBounds.left,
                        right: startMap.vrBounds.right,
                        top: startMap.vrBounds.top,
                        bottom: startMap.vrBounds.bottom
                    }
                },
                portalCoords: startMap.portals && findSpawnPortal(startMap.portals) ? {
                    x: findSpawnPortal(startMap.portals).x,
                    y: findSpawnPortal(startMap.portals).y
                } : undefined
            }]
        });

        const forbiddenMaps = new Set(['610010004']); // Dead Man's Gorge

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
                console.log(`Portal coords for ${mapId}:`, currentStep.portalCoords);
            }

            // Check if current map has the mob
            if (targetMaps.includes(mapId)) {
                paths.push({
                    steps: path,
                    mobLocations: [mapId]
                });
                continue; // Found a path, don't need to explore further from this map
            }

            // Explore connected maps
            const currentMap = this.maps[mapId];
            if (currentMap?.portals) {
                for (const portal of currentMap.portals) {
                    const targetMapId = portal.toMap.toString();
                    const targetMap = this.maps[targetMapId];
                    
                    if (!visited.has(targetMapId) && 
                        !forbiddenMaps.has(targetMapId) && 
                        targetMap) {
                        
                        const direction = this.getPortalDirection(portal.x, portal.y);
                        const newPath = [...path];
                        newPath.push({
                            mapId: targetMapId,
                            mapName: targetMap.name || 'Unknown',
                            direction: direction,
                            minimapUrl: this.getMinimapUrl(targetMapId),
                            minimap: targetMap.miniMap && {
                                width: targetMap.miniMap.width,
                                height: targetMap.miniMap.height,
                                centerX: targetMap.miniMap.centerX,
                                centerY: targetMap.miniMap.centerY,
                                vrBounds: targetMap.vrBounds && {
                                    left: targetMap.vrBounds.left,
                                    right: targetMap.vrBounds.right,
                                    top: targetMap.vrBounds.top,
                                    bottom: targetMap.vrBounds.bottom
                                }
                            }
                        });
                        
                        queue.push({
                            mapId: targetMapId,
                            path: newPath,
                            lastPortal: portal
                        });
                    }
                }
            }
        }

        console.log('Found paths:', paths);
        return paths;
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

export const getMapName = async (mapId: string): Promise<string> => {
    await phantomForestService.initialize();
    return phantomForestService.getMapName(mapId);
};
