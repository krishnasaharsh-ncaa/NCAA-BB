'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip
} from 'recharts';

interface StyleRadarProps {
  teamId: string;
  season: number;
}

// The 5-Axis "Shooting Profile"
const RADAR_METRICS = [
  { label: '3P%',    dbKey: 'three-point-pct',        max: 0.45 }, // 45% is elite
  { label: '2P%',    dbKey: 'two-point-pct',          max: 0.60 }, // 60% is elite
  { label: 'FT%',    dbKey: 'free-throw-pct',         max: 0.85 }, // 85% is elite
  { label: 'Opp 3P%', dbKey: 'opponent-three-point-pct', max: 0.40 }, // Lower is better (usually)
  { label: 'Opp 2P%', dbKey: 'opponent-two-point-pct',   max: 0.60 }, 
];

export const StyleRadar: React.FC<StyleRadarProps> = ({ teamId, season }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRadarData = async () => {
      setLoading(true);

      const targetStats = RADAR_METRICS.map(m => m.dbKey);

      // 1. Get Team Data (All games this season)
      // We calculate the average of the daily stats to get the "Season Average"
      const { data: teamRaw } = await supabase
        .from('tr_team_daily_stats')
        .select('stat_name, stat_value')
        .eq('team_id', teamId)
        .eq('season_year', season)
        .in('stat_name', targetStats);

      // 2. Get League Data (All days this season)
      const { data: leagueRaw } = await supabase
        .from('league_daily_trends')
        .select('stat_name, avg_value')
        .eq('season_year', season)
        .in('stat_name', targetStats);

      if (!teamRaw || !leagueRaw) {
        setLoading(false);
        return;
      }

      // 3. Helper to calculate average from raw rows
      const getAvg = (rows: any[], key: string, valKey: string) => {
        const filtered = rows.filter(r => r.stat_name === key);
        if (filtered.length === 0) return 0;
        const sum = filtered.reduce((acc, curr) => acc + Number(curr[valKey]), 0);
        return sum / filtered.length;
      };

      // 4. Build Chart Data
      const processed = RADAR_METRICS.map(metric => ({
        subject: metric.label,
        // Scale the data to 0-100 for better visuals if they are percentages (0.35 -> 35)
        Team: Number((getAvg(teamRaw, metric.dbKey, 'stat_value') * 100).toFixed(1)),
        League: Number((getAvg(leagueRaw, metric.dbKey, 'avg_value') * 100).toFixed(1)),
        fullMark: metric.max * 100, // Used for scaling if needed
      }));

      setData(processed);
      setLoading(false);
    };

    fetchRadarData();
  }, [teamId, season]);

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 h-full flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-2">Style Profile</h3>
      <p className="text-xs text-gray-500 mb-4">Season averages (Shooting & Defense)</p>

      <div className="flex-1 min-h-[250px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid gridType="polygon" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
              
              <Radar
                name="Team"
                dataKey="Team"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.4}
              />
              <Radar
                name="League Avg"
                dataKey="League"
                stroke="#9ca3af"
                fill="#9ca3af"
                fillOpacity={0.1}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
              <Tooltip 
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 itemStyle={{ fontSize: '12px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};