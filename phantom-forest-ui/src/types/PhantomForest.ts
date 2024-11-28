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
    toMapName?: string;
    [key: string]: any;
}

export interface MapData {
    name?: string;
    mobs?: MapMob[];
    portals?: Portal[];
    miniMap?: {
        centerX: number;
        centerY: number;
        height: number;
        width: number;
        magnification: number;
        canvas: string;
    };
    vrBounds?: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
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
    minimapUrl: string;
    minimap?: {
        width: number;
        height: number;
        centerX: number;
        centerY: number;
        magnification: number;
        canvas: string;
        vrBounds?: {
            left: number;
            right: number;
            top: number;
            bottom: number;
        };
    };
    portalCoords?: {
        x: number;
        y: number;
        toMapName?: string;
    };
    mobsInMap?: { [mobName: string]: number };
}

export interface Path {
    steps: PathStep[];
    mobLocations: string[];
    targetMob: string;  // Name of the mob at the end of this path
    score?: number;     // Optional score for path ranking
}
