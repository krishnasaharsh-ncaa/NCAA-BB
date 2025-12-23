'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

// Simple list of stats to toggle between
const TREND_STATS = [
  { label: '3P%', value: 'three-point-pct', dbKey: 'three_p_pct' },
  { label: '2P%', value: 'two-point-pct', dbKey: 'two_p_pct' },
  { label: 'FT%', value: 'free-throw-pct', dbKey: 'ft_pct' },
  { label: 'Possessions', value: 'possessions_per_game', dbKey: 'possessions' }, // Adjust if you have this
];

interface TeamVsLeagueTrendProps {
  teamId: string;
  teamName: string;
  season: number;
}

export const TeamVsLeagueTrend: React.FC<TeamVsLeagueTrendProps> = ({ teamId, teamName, season }) => {
  const [selectedStat, setSelectedStat] = useState(TREND_STATS[0]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch Team Data
      const { data: teamStats } = await supabase
        .from('tr_team_daily_stats')
        .select('stat_date, stat_value')
        .eq('team_id', teamId)
        .eq('season_year', season)
        .eq('stat_name', selectedStat.value) // Use the hyphenated name if that's what is in tr_team_daily_stats
        .order('stat_date', { ascending: true });

      // 2. Fetch League Data (from our optimized table)
      const { data: leagueStats } = await supabase
        .from('league_daily_trends')
        .select('stat_date, avg_value')
        .eq('season_year', season)
        .eq('stat_name', selectedStat.value)
        .order('stat_date', { ascending: true });

      if (!teamStats || !leagueStats) {
        setLoading(false);
        return;
      }

      // 3. Merge Data by Date
      // Create a map of League data for fast lookup
      const leagueMap = new Map(leagueStats.map(l => [l.stat_date, l.avg_value]));

      // Build the final array
      const merged = teamStats.map(t => ({
        date: t.stat_date,
        teamVal: Number(t.stat_value),
        leagueVal: leagueMap.get(t.stat_date) ? Number(leagueMap.get(t.stat_date)) : null
      }));

      setChartData(merged);
      setLoading(false);
    };

    fetchData();
  }, [teamId, season, selectedStat]);

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Performance vs. League Context</h3>
          <p className="text-xs text-gray-500">Comparing {teamName} daily trend against the national average.</p>
        </div>
        
        {/* Stat Selector Pills */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {TREND_STATS.map((stat) => (
            <button
              key={stat.value}
              onClick={() => setSelectedStat(stat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedStat.value === stat.value
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {stat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading trends...</div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">No trend data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(val) => val.substring(5)} 
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
              
              {/* LEAGUE LINE (Background Context) */}
              <Line 
                name="League Avg"
                type="monotone" 
                dataKey="leagueVal" 
                stroke="#9ca3af" 
                strokeWidth={2} 
                strokeDasharray="4 4" 
                dot={false} 
                activeDot={false}
              />

              {/* TEAM LINE (Main Focus) */}
              <Line 
                name={teamName}
                type="monotone" 
                dataKey="teamVal" 
                stroke="#2563eb" 
                strokeWidth={3} 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};