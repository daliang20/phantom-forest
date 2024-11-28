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

    const PathDisplay: React.FC<{
        path: Path;
        previousSteps?: string[];
        startNumber?: number;
    }> = ({ path, previousSteps = [], startNumber = 1 }) => {
        // Find the first step that's different from previous steps
        let skipCount = 0;
        if (previousSteps.length > 0) {
            for (let i = 0; i < path.steps.length; i++) {
                if (i >= previousSteps.length || path.steps[i].mapName !== previousSteps[i]) {
                    break;
                }
                skipCount = i + 1;
            }
        }

        // Group steps by map name to consolidate repeated maps
        const steps = path.steps.slice(skipCount);

        if (steps.length === 0) {
            return null;
        }

        return (
            <Box>
                <Typography variant="h6" sx={{ mt: skipCount > 0 ? 2 : 0 }}>
                    {skipCount > 0 ? `Continue to ${path.targetMob}:` : `Path to ${path.targetMob}:`}
                </Typography>
                {steps.map((step, index) => (
                    <Box key={index} sx={{ mt: 2, mb: 2 }}>
                        <Typography component="div">
                            {startNumber + index}. {step.mapName} ({step.mapId})
                            {step.mobsInMap && (
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
                            {index < steps.length - 1 && steps[index + 1].direction && (
                                <Typography component="div" variant="body2" sx={{ ml: 2 }}>
                                    • Portal: {steps[index + 1].direction}
                                </Typography>
                            )}
                            {index === steps.length - 1 && (
                                <Typography component="div" variant="body2" color="primary" sx={{ mt: 0.5, ml: 2, fontWeight: 'bold' }}>
                                    • Target: {path.targetMob}
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
                                {index < steps.length - 1 && (() => {
                                    const nextStep = steps[index + 1];
                                    const portalCoords = nextStep?.portalCoords;
                                    
                                    if (!portalCoords || typeof portalCoords.x !== 'number' || typeof portalCoords.y !== 'number' ||
                                        !step.minimap?.width || !step.minimap?.height || !step.minimap.vrBounds) {
                                        return null;
                                    }

                                    const bounds = step.minimap.vrBounds;
                                    const relativeX = (portalCoords.x - bounds.left) / (bounds.right - bounds.left);
                                    const relativeY = (portalCoords.y - bounds.top) / (bounds.bottom - bounds.top);
                                    const scaledWidth = 300;
                                    const scaledHeight = scaledWidth * step.minimap.height / step.minimap.width;

                                    return (
                                        <div 
                                            style={{
                                                position: 'absolute',
                                                left: `${relativeX * scaledWidth}px`,
                                                top: `${relativeY * scaledHeight}px`,
                                                width: '12px',
                                                height: '12px',
                                                backgroundColor: 'rgba(255, 165, 0, 0.6)',
                                                border: '2px solid orange',
                                                borderRadius: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                boxShadow: '0 0 8px rgba(255, 165, 0, 0.8)',
                                                animation: 'pulse 2s infinite',
                                                pointerEvents: 'none',
                                                zIndex: 1000,
                                                cursor: 'help'
                                            }}
                                            title={`Portal to ${nextStep.mapName} (${nextStep.mapId})`}
                                        />
                                    );
                                })()}
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
            {paths.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Found Paths
                    </Typography>
                    {paths.map((path, index) => (
                        <Paper key={index} sx={{ mt: 2, p: 2 }}>
                            <PathDisplay path={path} startNumber={1} />
                        </Paper>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default MobSearch;
