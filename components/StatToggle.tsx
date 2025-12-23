'use client';

import React from 'react';
import type { DailyStatKey } from '@/types/basketball';

// The actual stat keys used in your processed/pivoted data
export const AVAILABLE_STATS: DailyStatKey[] = [
  'three_p_pct',
  'two_p_pct',
  'ft_pct',
  'three_point_rate',
  'ftm_pg',
  'opp_three_p_pct',
  'opp_two_p_pct',
  'opp_ft_pct',
  'opp_ftm_pg',
  'opp_three_point_rate',
];

// Labels for UI

export const STAT_LABELS: Record<DailyStatKey, string> = {
  three_p_pct: '3P%',
  two_p_pct: '2P%',
  ft_pct: 'FT%',
  three_point_rate: '3P Rate',
  ftm_pg: 'FT Made/G',

  opp_three_p_pct: 'Opp 3P%',
  opp_two_p_pct: 'Opp 2P%',
  opp_ft_pct: 'Opp FT%',
  opp_ftm_pg: 'Opp FT Made/G',
  opp_three_point_rate: 'Opp 3P Rate',
};


interface StatToggleProps {
  selected: DailyStatKey;
  onChange: (s: DailyStatKey) => void;
}

export const StatToggle: React.FC<StatToggleProps> = ({
  selected,
  onChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {AVAILABLE_STATS.map((stat) => (
        <button
          key={stat}
          type="button"
          onClick={() => onChange(stat)}
          className={`px-3 py-1 rounded-full text-sm border ${
            selected === stat
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-800 border-gray-300'
          }`}
        >
          {STAT_LABELS[stat]}
        </button>
      ))}
    </div>
  );
};
