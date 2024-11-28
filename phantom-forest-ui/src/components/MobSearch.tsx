import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, Box, Typography, CircularProgress, Paper, Button, Chip } from '@mui/material';
import { getAllMobs, findPathsToMob, findPathToMultipleMobs } from '../services/PhantomForestService';
import { ConsolidatedMob, Path } from '../types/PhantomForest';

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
                            {startNumber + index}. {step.mapName}
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
                            {step.direction && (
                                <Typography component="div" variant="body2" sx={{ ml: 2 }}>
                                    • Portal: {step.direction}
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
