'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { DailyStatKey } from '@/types/basketball';
//import { format } from 'date-fns';

// Configurable Stat List
const AVAILABLE_STATS: { label: string; value: string }[] = [
  { label: '3P%', value: 'three-point-pct' },
  { label: '2P%', value: 'two-point-pct' },
  { label: 'FT%', value: 'free-throw-pct' },
  { label: '3P Rate', value: 'three-point-rate' },
  { label: 'FT Made/G', value: 'free-throws-made-per-game' },
  { label: 'Opp 3P%', value: 'opponent-three-point-pct' },
  { label: 'Opp 2P%', value: 'opponent-two-point-pct' },
];

interface TeamOption {
  id: string;
  name: string;
}

export const DateTeamLookup: React.FC = () => {
  // --- STATE ---
  const [allTeams, setAllTeams] = useState<TeamOption[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('KP076'); // Default: Duke
  const [teamSearch, setTeamSearch] = useState('Duke');
  
  // Default Date: Set to a date you know has data (e.g., Nov 4, 2024)
  const [selectedDate, setSelectedDate] = useState<string>('2024-11-04');
  const [selectedStat, setSelectedStat] = useState<string>('three-point-pct');

  // Results
  const [teamValue, setTeamValue] = useState<number | null>(null);
  const [leagueValue, setLeagueValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // --- 1. LOAD TEAMS (On Mount) ---
  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase.from('teams').select('team_id, team_name').order('team_name');
      if (data) {
        setAllTeams(data.map(t => ({ id: t.team_id, name: t.team_name })));
      }
    };
    fetchTeams();
  }, []);

  // --- 2. HANDLE TEAM SEARCH ---
  const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTeamSearch(val);
    const match = allTeams.find(t => t.name === val);
    if (match) setSelectedTeamId(match.id);
  };

  // --- 3. FETCH DATA (When any input changes) ---
  useEffect(() => {
    if (!selectedTeamId || !selectedDate || !selectedStat) return;

    const fetchData = async () => {
      setLoading(true);
      setTeamValue(null);
      setLeagueValue(null);

      // A. Fetch Team Value (Specific Team, Specific Day)
      const { data: teamData } = await supabase
        .from('tr_team_daily_stats')
        .select('stat_value')
        .eq('team_id', selectedTeamId)
        .eq('stat_date', selectedDate)
        .eq('stat_name', selectedStat)
        .maybeSingle();

      // B. Fetch League Average (From your new fast table)
      const { data: leagueData } = await supabase
        .from('league_daily_trends')
        .select('avg_value')
        .eq('stat_date', selectedDate)
        .eq('stat_name', selectedStat)
        .maybeSingle();

      if (teamData) setTeamValue(Number(teamData.stat_value));
      if (leagueData) setLeagueValue(Number(leagueData.avg_value));
      
      setLoading(false);
    };

    fetchData();
  }, [selectedTeamId, selectedDate, selectedStat]);

  // Helper: Calculate Difference
  const diff = (teamValue !== null && leagueValue !== null) 
    ? (teamValue - leagueValue) 
    : 0;
  
  const isPositive = diff > 0;
  
  // Some stats (like Opponent scoring) are better if LOWER. 
  // For simplicity, we assume higher is green, but you can add logic to flip this for defensive stats.
  const isGood = isPositive; 

  return (
    <section className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        🔎 Daily Performance Lookup
      </h2>

      {/* CONTROLS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* 1. Team Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Team</label>
          <input
            list="lookup-team-list"
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            value={teamSearch}
            onChange={handleTeamChange}
            placeholder="Search Team..."
          />
          <datalist id="lookup-team-list">
            {allTeams.map(t => <option key={t.id} value={t.name} />)}
          </datalist>
        </div>

        {/* 2. Date Picker */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* 3. Stat Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stat</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            value={selectedStat}
            onChange={(e) => setSelectedStat(e.target.value)}
          >
            {AVAILABLE_STATS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RESULTS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        
        {/* Team Card */}
        <div className="bg-gray-50 rounded p-4 border border-gray-100">
          <p className="text-xs text-gray-500 uppercase mb-1">{teamSearch} Value</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : teamValue !== null ? teamValue.toFixed(3) : 'N/A'}
          </p>
        </div>

        {/* Comparison Badge */}
        <div className="flex flex-col justify-center items-center">
          {loading || teamValue === null || leagueValue === null ? (
            <span className="text-gray-400 text-sm">--</span>
          ) : (
            <div className={`px-4 py-2 rounded-full font-bold text-sm ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {diff > 0 ? '+' : ''}{diff.toFixed(3)}
              <span className="ml-1 text-xs font-normal opacity-75">vs League</span>
            </div>
          )}
        </div>

        {/* League Card */}
        <div className="bg-gray-50 rounded p-4 border border-gray-100">
          <p className="text-xs text-gray-500 uppercase mb-1">League Avg</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : leagueValue !== null ? leagueValue.toFixed(3) : 'N/A'}
          </p>
        </div>

      </div>
    </section>
  );
};