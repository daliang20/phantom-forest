import React, { useState } from 'react';
import { Box } from '@mui/material';
import QuestSelect from './QuestSelect';
import MobSearch from './MobSearch';
import { availableQuests } from '../data/dailies';

interface Quest {
  id: string;
  title: string;
  description: string;
  count: number;
  mobs: string[];
  recommendedReroll?: boolean;
  rerollReason?: string;
}

interface DailyQuestsProps {
}

const DailyQuests: React.FC = () => {
  const [selectedMobs, setSelectedMobs] = useState<string[]>([]);
  const [startMapId] = useState<string>('610010004'); // Set to Phantom Forest starting map

  const handleQuestSelect = (mobs: string[]) => {
    setSelectedMobs(mobs);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      <QuestSelect onQuestSelect={handleQuestSelect} />
      <MobSearch 
        startMapId={startMapId} 
        selectedMobs={selectedMobs}
      />
    </Box>
  );
};

export default DailyQuests;
