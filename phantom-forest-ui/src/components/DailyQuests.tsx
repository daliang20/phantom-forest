import React, { useState } from 'react';
import { Box } from '@mui/material';
import QuestSelect from './QuestSelect';
import MobSearch from './MobSearch';

const availableQuests: Quest[] = [
  {
    id: '1',
    title: '[Wanted] Logging Work',
    description: 'Eliminate 50 Phantom Trees',
    count: 50,
    mobs: ['Phantom Tree'],
    recommendedReroll: true,
    rerollReason: 'Phantom Trees have low spawn rate and are spread out across multiple maps',
  },
  {
    id: '2',
    title: '[Wanted] Dust to Dust',
    description: 'Eliminate 200 Elderwraiths',
    count: 200,
    mobs: ['Elderwraith'],
  },
  {
    id: '3',
    title: '[Wanted] Ashes to Ashes',
    description: 'Eliminate 200 Krakian Spirits',
    count: 200,
    mobs: ['Krakian Spirit'],
    recommendedReroll: true,
    rerollReason: 'Krakian Spirits have very low spawn rate',
  },
  {
    id: '4',
    title: '[Wanted] A Sword of Heartbreak',
    description: 'Eliminate 200 Corrupted Masters',
    count: 200,
    mobs: ['Corrupted Master'],
  },
  {
    id: '5',
    title: '[Wanted] Caught in the Storm',
    description: 'Eliminate 200 Corrupted Stormcasters',
    count: 200,
    mobs: ['Corrupted Stormcaster'],
  },
  {
    id: '6',
    title: '[Wanted] Broken Arrow',
    description: 'Eliminate 200 Corrupted Windreavers',
    count: 200,
    mobs: ['Corrupted Windreaver'],
  },
  {
    id: '7',
    title: '[Wanted] The Lost Shadow',
    description: 'Eliminate 200 Corrupted Shadowknights',
    count: 200,
    mobs: ['Corrupted Shadowknight'],
  },
  {
    id: '8',
    title: '[Wanted] Blind Flame',
    description: 'Eliminate 200 Corrupted Flamekeepers',
    count: 200,
    mobs: ['Corrupted Flamekeeper'],
  },
];

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
