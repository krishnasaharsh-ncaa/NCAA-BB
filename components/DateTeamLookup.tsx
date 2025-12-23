'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { DailyStatKey } from '@/types/basketball';

const AVAILABLE_STATS: { label: string; value: string }[] = [
  { label: '3P%', value: 'three-point-pct' },
  { label: '2P%', value: 'two-point-pct' },
  { label: 'FT%', value: 'free-throw-pct' },
  { label: '3P Rate', value: 'three-point-rate' },
  { label: 'FT Made/G', value: 'free-throws-made-per-game' },
];

interface TeamOption {
  id: string;
  name: string;
}

export const DateTeamLookup: React.FC = () => {
  const [allTeams, setAllTeams] = useState<TeamOption[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('KP076');
  const [teamSearch, setTeamSearch] = useState('Duke');
  const [selectedDate, setSelectedDate] = useState<string>('2024-11-04');
  const [selectedStat, setSelectedStat] = useState<string>('three-point-pct');
  const [teamValue, setTeamValue] = useState<number | null>(null);
  const [leagueValue, setLeagueValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase.from('teams').select('team_id, team_name').order('team_name');
      if (data) {
        setAllTeams(data.map(t => ({ id: t.team_id, name: t.team_name })));
      }
    };
    fetchTeams();
  }, []);

  const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTeamSearch(val);
    const match = allTeams.find(t => t.name === val);
    if (match) setSelectedTeamId(match.id);
  };

  useEffect(() => {
    if (!selectedTeamId || !selectedDate || !selectedStat) return;

    const fetchData = async () => {
      setLoading(true);
      const { data: teamData } = await supabase
        .from('tr_team_daily_stats')
        .select('stat_value')
        .eq('team_id', selectedTeamId)
        .eq('stat_date', selectedDate)
        .eq('stat_name', selectedStat)
        .maybeSingle();

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

  const diff = (teamValue !== null && leagueValue !== null) ? (teamValue - leagueValue) : 0;
  const isGood = diff > 0;

  return (
    <section className="card p-6 mb-8">
      <h2 className="text-heading-3 mb-6">Daily Performance Lookup</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-label mb-2 block">Team</label>
          <input
            list="lookup-team-list"
            type="text"
            className="input-base w-full"
            value={teamSearch}
            onChange={handleTeamChange}
            placeholder="Search Team..."
          />
          <datalist id="lookup-team-list">
            {allTeams.map(t => <option key={t.id} value={t.name} />)}
          </datalist>
        </div>

        <div>
          <label className="text-label mb-2 block">Date</label>
          <input
            type="date"
            className="input-base w-full"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-label mb-2 block">Stat</label>
          <select
            className="input-base w-full"
            value={selectedStat}
            onChange={(e) => setSelectedStat(e.target.value)}
          >
            {AVAILABLE_STATS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 text-center">
          <p className="text-label mb-2">{teamSearch} Value</p>
          <p className="text-3xl font-black text-slate-900">
            {loading ? '...' : teamValue !== null ? teamValue.toFixed(3) : 'N/A'}
          </p>
        </div>

        <div className="flex flex-col justify-center items-center">
          {loading || teamValue === null || leagueValue === null ? (
            <span className="text-slate-400 text-sm">--</span>
          ) : (
            <div className={isGood ? 'badge-success text-base' : 'badge-error text-base'}>
              {diff > 0 ? '+' : ''}{diff.toFixed(3)}
              <span className="text-xs font-normal opacity-75 ml-1">vs League</span>
            </div>
          )}
        </div>

        <div className="card p-6 text-center">
          <p className="text-label mb-2">League Avg</p>
          <p className="text-3xl font-black text-slate-900">
            {loading ? '...' : leagueValue !== null ? leagueValue.toFixed(3) : 'N/A'}
          </p>
        </div>
      </div>
    </section>
  );
};