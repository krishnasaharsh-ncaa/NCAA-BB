'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { StatToggle } from './StatToggle';
import type { DailyStatKey, LeagueDailyAggregate } from '@/types/basketball';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const AVAILABLE_SEASONS = [2025, 2024, 2023, 2022];

// The DB Keys must match the hyphenated list in your 'league_daily_trends' table
const STAT_MAP: Record<string, DailyStatKey> = {
  'three-point-pct': 'three_p_pct',
  'two-point-pct': 'two_p_pct',
  'free-throw-pct': 'ft_pct',
  'three-point-rate': 'three_point_rate',
  'free-throws-made-per-game': 'ftm_pg',
  'opponent-three-point-pct': 'opp_three_p_pct',
  'opponent-two-point-pct': 'opp_two_p_pct',
  'opponent-free-throw-pct': 'opp_ft_pct',
  'opponent-free-throws-made-per-game': 'opp_ftm_pg',
  'opponent-three-point-rate': 'opp_three_point_rate',
};

export const LeagueOverview: React.FC = () => {
  const [selectedStat, setSelectedStat] = useState<DailyStatKey>('three_p_pct');
  const [selectedSeason, setSelectedSeason] = useState<number>(2025);
  const [data, setData] = useState<LeagueDailyAggregate[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dbStatName, setDbStatName] = useState<string>('three-point-pct');

  // 1. Resolve DB Stat Name (Internal -> DB Key)
  useEffect(() => {
    const match = Object.keys(STAT_MAP).find(k => STAT_MAP[k] === selectedStat);
    setDbStatName(match || selectedStat);
  }, [selectedStat]);

  // 2. Fetch Data from the new, optimized table
  useEffect(() => {
    if (!dbStatName) return;

    const fetchLeagueStats = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        // ✅ QUERYING NEW TABLE: league_daily_trends
        const { data: raw, error } = await supabase
          .from('league_daily_trends') 
          .select('stat_date, avg_value') // Selects the pre-calculated average
          .eq('season_year', selectedSeason)
          .eq('stat_name', dbStatName)
          .order('stat_date', { ascending: true }); // Fast because the table is small

        if (error) throw error;

        if (!raw || raw.length === 0) {
          setData([]);
          return;
        }

        // Map directly to chart format (No Aggregation Needed!)
        const formatted: LeagueDailyAggregate[] = raw.map(row => ({
          stat_date: row.stat_date,
          value: Number(row.avg_value) // Use avg_value column
        }));

        setData(formatted);

      } catch (err: any) {
        console.error("Fetch error:", err);
        setErrorMsg(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueStats();
  }, [dbStatName, selectedSeason]);

  const currentValue = data.length > 0 ? data[data.length - 1].value : undefined;

  return (
    <div className="space-y-6"> {/* Changed from section/margin-bottom to space-y */}
      
      {/* 1. CONTROLS ROW (Moved Season Selector here) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Stat Toggles */}
        <div className="overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
           <StatToggle selected={selectedStat} onChange={setSelectedStat} />
        </div>

        {/* Season Dropdown */}
        <div className="flex items-center gap-2 min-w-fit">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Season</label>
          <select
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
          >
            {AVAILABLE_SEASONS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart (Takes up 2 columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Trend Analysis</h3>
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">Loading trend data...</div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="stat_date"
                    tickFormatter={(d) => d.substring(5)}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    tickLine={false}
                    axisLine={false}
                    width={35}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* KPI Card (Takes up 1 column) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Current League Avg</p>
          <div className="text-5xl font-black text-slate-800 tracking-tight">
            {currentValue !== undefined ? currentValue.toFixed(1) : '-'}
          </div>
          <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
             {selectedStat.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};