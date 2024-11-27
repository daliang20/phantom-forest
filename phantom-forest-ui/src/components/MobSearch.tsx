import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import { getAllMobs, findPathsToMob, findPathToMultipleMobs } from '../services/PhantomForestService';
import { ConsolidatedMob, Path } from '../types/PhantomForest';

interface MobSearchProps {
    startMapId: string;
}

const MobSearch: React.FC<MobSearchProps> = ({ startMapId }) => {
    const [mobs, setMobs] = useState<ConsolidatedMob[]>([]);
    const [selectedMobs, setSelectedMobs] = useState<ConsolidatedMob[]>([]);
    const [paths, setPaths] = useState<Path[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadMobs();
    }, []);

    const loadMobs = async () => {
        try {
            setLoading(true);
            setError(null);
            const mobsData = await getAllMobs();
            setMobs(mobsData);
        } catch (err) {
            setError('Failed to load mobs');
            console.error('Error loading mobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMobSelect = (_: any, newValue: ConsolidatedMob[]) => {
        setSelectedMobs(newValue);
    };

    const handleFindPath = async () => {
        if (selectedMobs.length === 0) return;

        try {
            setError(null);
            const pathsData = await findPathToMultipleMobs(startMapId, selectedMobs.map(mob => mob.name));
            setPaths(pathsData);
        } catch (err) {
            setError('Failed to find paths');
            console.error('Error finding paths:', err);
        }
    };

    const PathDisplay: React.FC<{ path: Path }> = ({ path }) => {
        const calculatePortalPosition = (portalCoords: { x: number; y: number }, minimap: { width: number, height: number, centerX: number, centerY: number, vrBounds?: { left: number, right: number, top: number, bottom: number } }, displayWidth: number, displayHeight: number) => {
            if (!minimap.vrBounds) {
                console.error('No vrBounds found for map');
                return { x: 0, y: 0 };
            }

            // For X coordinates:
            // - Game world: -2008 (left) to 1050 (right)
            // - Need to normalize to 0-1 range
            const normalizedX = (portalCoords.x - minimap.vrBounds.left) / (minimap.vrBounds.right - minimap.vrBounds.left);
            
            // For Y coordinates:
            // - Game world: -300 (top) to 290 (bottom)
            // - Need to normalize to 0-1 range
            // - No need to flip Y since both game and browser use top-to-bottom
            const normalizedY = (portalCoords.y - minimap.vrBounds.top) / (minimap.vrBounds.bottom - minimap.vrBounds.top);

            // Scale to display dimensions
            const scaledX = normalizedX * displayWidth;
            const scaledY = normalizedY * displayHeight;

            console.log('Portal position calculation:', {
                portalCoords,
                vrBounds: minimap.vrBounds,
                normalized: { x: normalizedX, y: normalizedY },
                scaled: { x: scaledX, y: scaledY },
                display: { width: displayWidth, height: displayHeight }
            });

            return { x: scaledX, y: scaledY };
        };

        return (
            <Box>
                <Typography variant="h6">Path to {path.targetMob}:</Typography>
                {path.steps.map((step, index) => (
                    <Box key={index} sx={{ mt: 2, mb: 2 }}>
                        <Typography>
                            {index + 1}. {step.mapName}
                            {step.direction && ` (Portal: ${step.direction})`}
                            {index === path.steps.length - 1 && (
                                <Typography variant="body2" color="primary" sx={{ mt: 0.5, fontWeight: 'bold' }}>
                                    Target: {path.targetMob}
                                </Typography>
                            )}
                        </Typography>
                        {step.minimapUrl && step.minimap && (
                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                <img 
                                    ref={(el) => {
                                        if (el) {
                                            // Log the actual displayed dimensions
                                            console.log(`Minimap dimensions for ${step.mapName}:`, {
                                                display: {
                                                    width: el.offsetWidth,
                                                    height: el.offsetHeight
                                                },
                                                natural: {
                                                    width: el.naturalWidth,
                                                    height: el.naturalHeight
                                                },
                                                minimap: step.minimap,
                                                portal: step.portalCoords
                                            });
                                        }
                                    }}
                                    src={step.minimapUrl} 
                                    alt={`Map: ${step.mapName}`} 
                                    style={{ 
                                        width: '300px',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        display: 'block'
                                    }}
                                    onLoad={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        // Force a re-render when image loads to ensure we have correct dimensions
                                        if (img.parentElement) {
                                            img.parentElement.style.height = `${img.offsetHeight}px`;
                                        }
                                    }}
                                />
                                {step.portalCoords && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#ff0000',
                                            borderRadius: '50%',
                                            border: '1px solid white',
                                            ...(() => {
                                                const img = document.querySelector(`img[alt="Map: ${step.mapName}"]`) as HTMLImageElement;
                                                if (!img) return { left: 0, top: 0 };
                                                
                                                const pos = calculatePortalPosition(
                                                    step.portalCoords, 
                                                    step.minimap,
                                                    img.offsetWidth,
                                                    img.offsetHeight
                                                );
                                                return {
                                                    left: `${pos.x}px`,
                                                    top: `${pos.y}px`
                                                };
                                            })(),
                                            transform: 'translate(-50%, -50%)',
                                            zIndex: 1,
                                            boxShadow: '0 0 2px rgba(0,0,0,0.5)',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                width: '10px',
                                                height: '10px',
                                                backgroundColor: '#ff3333'
                                            }
                                        }}
                                        title={`Portal at (${Math.round(step.portalCoords.x)}, ${Math.round(step.portalCoords.y)})`}
                                    />
                                )}
                            </Box>
                        )}
                    </Box>
                ))}
            </Box>
        );
    };

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Typography color="error">{error}</Typography>;
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 800, margin: '0 auto', p: 2 }}>
            <Autocomplete
                multiple
                options={mobs}
                getOptionLabel={(mob) => mob.name}
                onChange={handleMobSelect}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Search for mobs"
                        variant="outlined"
                    />
                )}
            />
            <Button onClick={handleFindPath} sx={{ mt: 2 }}>Find Paths</Button>
            {paths.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6">
                        Found Paths
                    </Typography>
                    {paths.map((path, pathIndex) => (
                        <Paper key={pathIndex} sx={{ mt: 2, p: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                Path {pathIndex + 1} - Target: {path.targetMob}
                            </Typography>
                            <PathDisplay path={path} />
                        </Paper>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default MobSearch;
