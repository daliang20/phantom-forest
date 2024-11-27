export interface Mob {
    id: string;
    name: string;
}

export interface MapMob {
    id: number;
    name?: string;
    [key: string]: any;
}

export interface Portal {
    toMap: number;
    x: number;
    y: number;
    [key: string]: any;
}

export interface MapData {
    name?: string;
    mobs?: MapMob[];
    portals?: Portal[];
    [key: string]: any;
}

export interface MobsData {
    [key: string]: RawMob;
}

export interface MapsData {
    [key: string]: MapData;
}

export interface ConsolidatedMob {
    id: string;
    name: string;
    locations: string[];
}

export interface RawMob {
    id: number;
    name: string;
    meta: {
        level: number;
        [key: string]: any;
    };
}

export interface PathStep {
    mapId: string;
    mapName: string;
    direction: string | null;
    minimapUrl?: string;
    portalCoords?: {
        x: number;
        y: number;
    };
    minimap?: {
        width: number;
        height: number;
        centerX: number;
        centerY: number;
        vrBounds?: {
            left: number;
            right: number;
            top: number;
            bottom: number;
        };
    };
}

export interface Path {
    steps: PathStep[];
    mobLocations: string[];
}
