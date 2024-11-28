import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, Box, Typography, CircularProgress, Paper, Button, Chip } from '@mui/material';
import { getAllMobs, findPathsToMob, findPathToMultipleMobs } from '../services/PhantomForestService';
import { ConsolidatedMob, Path } from '../types/PhantomForest';

// Add keyframes for portal pulse animation
const pulseKeyframes = `
@keyframes pulse {
    0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
    }
    50% {
        transform: translate(-50%, -50%) scale(1.5);
        opacity: 0.5;
    }
    100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
    }
}
`;

// Add style tag to document
const style = document.createElement('style');
style.innerHTML = pulseKeyframes;
document.head.appendChild(style);

interface MobSearchProps {
    startMapId: string;
    selectedMobs?: string[];
}

const MobSearch: React.FC<MobSearchProps> = ({ startMapId, selectedMobs: initialSelectedMobs }) => {
    const [mobs, setMobs] = useState<ConsolidatedMob[]>([]);
    const [selectedMobs, setSelectedMobs] = useState<ConsolidatedMob[]>(
        initialSelectedMobs?.map(mobName => ({ 
            id: mobName, // Using name as id since we don't have actual ids
            name: mobName,
            locations: [] // Empty locations since we don't have this info initially
        })) || []
    );
    const [paths, setPaths] = useState<Path[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const allMobs = await getAllMobs();
                setMobs(allMobs);
                if (initialSelectedMobs && initialSelectedMobs.length > 0) {
                    const selectedMobObjects = allMobs.filter(mob => 
                        initialSelectedMobs.includes(mob.name)
                    );
                    setSelectedMobs(selectedMobObjects);
                }
                setLoading(false);
            } catch (error) {
                setError('Error loading mob data');
                setLoading(false);
            }
        };
        loadData();
    }, [initialSelectedMobs]);

    useEffect(() => {
        const findPaths = async () => {
            if (selectedMobs.length === 0) {
                setPaths([]);
                return;
            }

            setLoading(true);
            try {
                const paths = selectedMobs.length === 1
                    ? await findPathsToMob(startMapId, selectedMobs[0].name)
                    : await findPathToMultipleMobs(startMapId, selectedMobs.map(m => m.name));
                setPaths(paths);
            } catch (error) {
                setError('Error finding paths');
            } finally {
                setLoading(false);
            }
        };
        findPaths();
    }, [startMapId, selectedMobs]);

    const handleMobSelect = (_event: any, value: ConsolidatedMob[]) => {
        setSelectedMobs(value);
    };

    // Define a list of distinct, bright colors
    const DISTINCT_COLORS = [
        '#FF0000', // Red
        '#00FF00', // Lime
        '#0000FF', // Blue
        '#FF00FF', // Magenta
        '#00FFFF', // Cyan
        '#FFFF00', // Yellow
        '#FF4500', // Orange Red
        '#8A2BE2', // Blue Violet
        '#32CD32', // Lime Green
        '#FF1493', // Deep Pink
        '#00CED1', // Dark Turquoise
        '#FF8C00', // Dark Orange
        '#9400D3', // Dark Violet
        '#00FA9A', // Medium Spring Green
        '#DC143C', // Crimson
        '#4169E1', // Royal Blue
        '#FFD700', // Gold
        '#FF69B4', // Hot Pink
        '#7B68EE', // Medium Slate Blue
        '#00FF7F', // Spring Green
    ];

    // Keep track of used colors in the component
    const [usedColors] = useState(new Map<string, string>());

    const getPortalColor = (direction: string | null, index: number, totalInDirection: number) => {
        const portalKey = `${direction}-${index}`;
        
        // If this portal already has a color assigned, return it
        if (usedColors.has(portalKey)) {
            return usedColors.get(portalKey)!;
        }

        // Get available colors (colors not yet used)
        const availableColors = DISTINCT_COLORS.filter(color => !Array.from(usedColors.values()).includes(color));
        
        // If we've used all colors, start over with the full list
        const colorPool = availableColors.length > 0 ? availableColors : DISTINCT_COLORS;
        
        // Pick a random color from the available colors
        const randomColor = colorPool[Math.floor(Math.random() * colorPool.length)];
        
        // Store the color for this portal
        usedColors.set(portalKey, randomColor);
        
        return randomColor;
    };

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Typography color="error">{error}</Typography>;
    }

    if (paths.length > 0) {
        // Define the type for our consolidated map steps
        interface ConsolidatedMapStep {
            mapId: string;
            mapName: string;
            minimap: any; // Simplified type for now
            minimapUrl?: string;
            mobsInMap: { [key: string]: number };
            targetMobs: string[];
            nextDirections: Array<{ 
                direction: string | null; 
                targetMob?: string;
                portalCoords?: { x: number; y: number };
            }>;
            sequence: number; // Track the first appearance of this map
        };

        // Keep track of map order
        const mapOrder = new Set<string>();
        paths.forEach(path => {
            path.steps.forEach(step => {
                if (!mapOrder.has(step.mapId)) {
                    mapOrder.add(step.mapId);
                }
            });
        });

        // First consolidate all steps across all paths
        const consolidatedMapSteps = paths.reduce<Record<string, ConsolidatedMapStep>>((acc, path) => {
            path.steps.forEach((step, index) => {
                if (!acc[step.mapId]) {
                    acc[step.mapId] = {
                        mapId: step.mapId,
                        mapName: step.mapName,
                        minimap: step.minimap,
                        minimapUrl: step.minimapUrl,
                        mobsInMap: {},
                        targetMobs: [],
                        nextDirections: [],
                        sequence: Array.from(mapOrder).indexOf(step.mapId)
                    };
                }

                // Add mobs from this step
                if (step.mobsInMap) {
                    Object.entries(step.mobsInMap).forEach(([mob, count]) => {
                        acc[step.mapId].mobsInMap[mob] = (acc[step.mapId].mobsInMap[mob] || 0) + count;
                    });
                }

                // Add target mob if this is the last step
                if (index === path.steps.length - 1) {
                    if (!acc[step.mapId].targetMobs.includes(path.targetMob)) {
                        acc[step.mapId].targetMobs.push(path.targetMob);
                    }
                }

                // Add portal direction if there is a next step
                const nextStep = path.steps[index + 1];
                if (nextStep && nextStep.direction) {
                    const existingDirection = acc[step.mapId].nextDirections.find(
                        d => d.direction === nextStep.direction && d.targetMob === path.targetMob
                    );
                    if (!existingDirection) {
                        acc[step.mapId].nextDirections.push({
                            direction: nextStep.direction,
                            targetMob: path.targetMob,
                            portalCoords: nextStep.portalCoords
                        });
                    }
                }
            });
            return acc;
        }, {});

        // Convert to array and sort by sequence
        const orderedSteps = Object.values(consolidatedMapSteps)
            .sort((a, b) => a.sequence - b.sequence);

        return (
            <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Found Paths
                </Typography>
                {orderedSteps.map((step, index) => (
                    <Paper key={index} sx={{ mt: 2, p: 2 }}>
                        <Box sx={{ mt: 2, mb: 2 }}>
                            <Typography component="div">
                                {index + 1}. {step.mapName} ({step.mapId})
                                {Object.keys(step.mobsInMap).length > 0 && (
                                    <Typography 
                                        component="div" 
                                        variant="body2" 
                                        color="text.secondary"
                                        sx={{ ml: 2 }}
                                    >
                                        {Object.entries(step.mobsInMap)
                                            .sort((a, b) => b[1] - a[1]) // Sort by count, highest first
                                            .map(([mob, count], i) => (
                                                <div key={i}>• {mob} × {count}</div>
                                            ))}
                                    </Typography>
                                )}
                                {(() => {
                                    // Group portals by direction
                                    const portalsByDirection = step.nextDirections.reduce<Record<string, typeof step.nextDirections>>((acc, dir) => {
                                        // Use the exact direction string for grouping to preserve case
                                        const direction = dir.direction || 'default';
                                        if (!acc[direction]) acc[direction] = [];
                                        acc[direction].push(dir);
                                        return acc;
                                    }, {});

                                    return Object.entries(portalsByDirection).map(([direction, portals]) => 
                                        portals.map((portal, index) => {
                                            const portalColor = getPortalColor(portal.direction, index, portals.length);
                                            return (
                                                <Typography 
                                                    key={`${direction}-${index}`}
                                                    component="div" 
                                                    variant="body2" 
                                                    sx={{ 
                                                        ml: 2,
                                                        color: portalColor,
                                                        fontWeight: 'bold',
                                                        textShadow: '0 0 1px rgba(0,0,0,0.2)'
                                                    }}
                                                >
                                                    • Portal: {portal.direction} 
                                                    {portal.portalCoords && (
                                                        <span>
                                                            at x:{Math.round(portal.portalCoords.x)}, y:{Math.round(portal.portalCoords.y)}
                                                        </span>
                                                    )}
                                                    {portal.targetMob && ` (to ${portal.targetMob})`}
                                                </Typography>
                                            );
                                        })
                                    ).flat();
                                })()}
                                {step.targetMobs.length > 0 && (
                                    <Typography component="div" variant="body2" color="primary" sx={{ mt: 0.5, ml: 2, fontWeight: 'bold' }}>
                                        • Target{step.targetMobs.length > 1 ? 's' : ''}: {step.targetMobs.join(', ')}
                                    </Typography>
                                )}
                            </Typography>
                            {step.minimapUrl && step.minimap && (
                                <Box 
                                    sx={{ 
                                        position: 'relative', 
                                        display: 'inline-block',
                                        mt: 1,
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        borderRadius: 1,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <img 
                                        src={step.minimapUrl} 
                                        alt={`Map: ${step.mapName}`} 
                                        style={{ 
                                            width: '300px',
                                            height: 'auto',
                                            display: 'block'
                                        }}
                                    />
                                    {(() => {
                                        // Group portals by direction for the minimap
                                        const portalsByDirection = step.nextDirections.reduce<Record<string, typeof step.nextDirections>>((acc, dir) => {
                                            // Use the exact direction string for grouping to preserve case
                                            const direction = dir.direction || 'default';
                                            if (!acc[direction]) acc[direction] = [];
                                            acc[direction].push(dir);
                                            return acc;
                                        }, {});

                                        return Object.entries(portalsByDirection).map(([direction, portals]) => 
                                            portals.map((nextDirection, index) => {
                                                if (!nextDirection.portalCoords) return null;
                                                
                                                const portalCoords = nextDirection.portalCoords;
                                                
                                                if (typeof portalCoords.x !== 'number' || typeof portalCoords.y !== 'number' ||
                                                    !step.minimap?.width || !step.minimap?.height || !step.minimap.vrBounds) {
                                                    return null;
                                                }

                                                const bounds = step.minimap.vrBounds;
                                                const relativeX = (portalCoords.x - bounds.left) / (bounds.right - bounds.left);
                                                const relativeY = (portalCoords.y - bounds.top) / (bounds.bottom - bounds.top);
                                                const scaledWidth = 300;
                                                const scaledHeight = scaledWidth * step.minimap.height / step.minimap.width;
                                                const portalColor = getPortalColor(nextDirection.direction, index, portals.length);

                                                return (
                                                    <div 
                                                        key={`${direction}-${index}`}
                                                        style={{
                                                            position: 'absolute',
                                                            left: `${relativeX * scaledWidth}px`,
                                                            top: `${relativeY * scaledHeight}px`,
                                                            width: '16px',
                                                            height: '16px',
                                                            backgroundColor: `${portalColor}ee`,
                                                            border: `3px solid ${portalColor}`,
                                                            borderRadius: '50%',
                                                            transform: 'translate(-50%, -50%)',
                                                            boxShadow: `0 0 12px ${portalColor}`,
                                                            animation: 'pulse 2s infinite',
                                                            pointerEvents: 'none',
                                                            zIndex: 1000,
                                                            cursor: 'help'
                                                        }}
                                                        title={`Portal to ${nextDirection.targetMob ? `${nextDirection.targetMob} - ` : ''}${nextDirection.direction}`}
                                                    />
                                                );
                                            })
                                        ).flat().filter(Boolean);
                                    })()}
                                </Box>
                            )}
                        </Box>
                    </Paper>
                ))}
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 800, margin: '0 auto', p: 2 }}>
            <Autocomplete
                multiple
                options={mobs}
                value={selectedMobs}
                getOptionLabel={(mob) => mob.name}
                onChange={handleMobSelect}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Search for mobs"
                        variant="outlined"
                    />
                )}
                isOptionEqualToValue={(option, value) => option.name === value.name}
            />
        </Box>
    );
};

export default MobSearch;
