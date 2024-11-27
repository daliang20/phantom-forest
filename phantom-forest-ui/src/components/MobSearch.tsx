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
        return (
            <Box>
                <Typography variant="h6">Path to {path.targetMob}:</Typography>
                {path.steps.map((step, index) => (
                    <Box key={index} sx={{ mt: 2, mb: 2 }}>
                        <Typography component="div">
                            {index + 1}. {step.mapName}
                            {step.direction && ` (Portal: ${step.direction})`}
                            {index === path.steps.length - 1 && (
                                <Typography component="div" variant="body2" color="primary" sx={{ mt: 0.5, fontWeight: 'bold' }}>
                                    Target: {path.targetMob}
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
