import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Grid,
  Tooltip,
  Typography
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { availableQuests } from '../data/dailies';

interface Quest {
  id: string;
  title: string;
  description: string;
  mobs: string[];
  count: number;
  recommendedReroll?: boolean;
  rerollReason?: string;
}

interface QuestSelectProps {
  onQuestSelect: (mobs: string[]) => void;
}

const QuestSelect: React.FC<QuestSelectProps> = ({ onQuestSelect }) => {
  const [selectedQuests, setSelectedQuests] = useState<string[]>([]);

  const handleQuestToggle = (questId: string) => {
    setSelectedQuests((prev) => {
      const newSelection = prev.includes(questId)
        ? prev.filter((id) => id !== questId)
        : prev.length >= 3
        ? prev
        : [...prev, questId];

      // Get all mobs from selected quests
      const selectedMobs = availableQuests
        .filter((quest) => newSelection.includes(quest.id))
        .flatMap((quest) => quest.mobs);

      // Pass selected mobs to parent component
      onQuestSelect(selectedMobs);

      return newSelection;
    });
  };

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Daily Quests
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Select up to 3 quests to complete for today
      </Typography>

      <Grid container spacing={2}>
        {availableQuests.map((quest) => (
          <Grid item xs={12} sm={6} md={4} key={quest.id}>
            <Card 
              sx={{ 
                height: '100%',
                position: 'relative',
                bgcolor: selectedQuests.includes(quest.id) ? 'action.selected' : 'background.paper',
                transition: 'background-color 0.2s',
                '&:hover': {
                  bgcolor: selectedQuests.includes(quest.id) 
                    ? 'action.selected' 
                    : 'action.hover',
                },
              }}
            >
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  mb: 1
                }}>
                  <Box sx={{ flex: 1, pr: 4 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {quest.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {quest.description}
                    </Typography>
                    {quest.recommendedReroll && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Chip
                            icon={<WarningIcon />}
                            label="Consider Rerolling"
                            color="warning"
                            size="small"
                          />
                        </Box>
                        {quest.rerollReason && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              fontStyle: 'italic',
                              fontSize: '0.875rem',
                              lineHeight: '1.4'
                            }}
                          >
                            {quest.rerollReason}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                  <Box>
                    <Checkbox
                      checked={selectedQuests.includes(quest.id)}
                      onChange={() => handleQuestToggle(quest.id)}
                      disabled={selectedQuests.length >= 3 && !selectedQuests.includes(quest.id)}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QuestSelect;
