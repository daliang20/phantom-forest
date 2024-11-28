interface Quest {
  id: string;
  title: string;
  description: string;
  count: number;
  mobs: string[];
  recommendedReroll?: boolean;
  rerollReason?: string;
}

export const availableQuests: Quest[] = [
  {
    id: '1',
    title: '[Wanted] Logging Work',
    description: 'Eliminate 50 Phantom Trees',
    count: 50,
    mobs: ['Phantom Tree'],
    recommendedReroll: true,
    rerollReason: 'Phantom Trees have low spawn rate and are spread out across multiple maps, but it\'s honestly not that bad',
  },
  {
    id: '2',
    title: '[Wanted] Dust to Dust',
    description: 'Eliminate 200 Elderwraiths',z
    count: 200,
    mobs: ['Elderwraith']
  },
  {
    id: '3',
    title: '[Wanted] Ashes to Ashes',
    description: 'Eliminate 200 Krakian Spirits',
    count: 200,
    mobs: ['Krakian Spirit'],
    recommendedReroll: true,
    rerollReason: 'Krakian Spirits spawn from Phantom Trees',
  },
  {
    id: '4',
    title: '[Wanted] A Sword of Heartbreak',
    description: 'Eliminate 200 Corrupted Masters',
    count: 200,
    mobs: ['Corrupted Master']
  },
  {
    id: '5',
    title: '[Wanted] Caught in the Storm',
    description: 'Eliminate 200 Corrupted Stormcasters',
    count: 200,
    mobs: ['Corrupted Stormcaster']
  },
  {
    id: '6',
    title: '[Wanted] Broken Arrow',
    description: 'Eliminate 200 Corrupted Windreavers',
    count: 200,
    mobs: ['Corrupted Windreaver']
  },
  {
    id: '7',
    title: '[Wanted] The Lost Shadow',
    description: 'Eliminate 200 Corrupted Shadowknights',
    count: 200,
    mobs: ['Corrupted Shadowknight']
  },
  {
    id: '8',
    title: '[Wanted] Blind Flame',
    description: 'Eliminate 200 Corrupted Flamekeepers',
    count: 200,
    mobs: ['Corrupted Flamekeeper']
  }
];
