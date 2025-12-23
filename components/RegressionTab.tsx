'use client';

import React, { useState } from 'react';
import type { StatKey } from '@/types/basketball';

const AVAILABLE_FEATURES: StatKey[] = [
  'three_p_pct',
  'two_p_pct',
  'ft_pct',
  'off_eff',
  'def_eff',
  'kp_total',
];

const TARGET_OPTIONS: StatKey[] = [
  'off_eff',
  'def_eff',
  'kp_total',
  'three_p_pct',
];

export const RegressionTab: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<StatKey[]>(['three_p_pct', 'two_p_pct']);
  const [target, setTarget] = useState<StatKey>('off_eff');
  const [status, setStatus] = useState<string>('');

  const toggleFeature = (f: StatKey) => {
    setSelectedFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const handleRun = () => {
    // Placeholder only – here you will later call your regression API / Python service
    setStatus(
      `Pretending to run regression for team "${selectedTeam || 'ALL'}" with ` +
        `features [${selectedFeatures.join(', ')}] → target "${target}".`
    );
  };

  return (
    <section className="mt-8 bg-white rounded-lg shadow p-4 space-y-4">
      <h2 className="text-xl font-semibold mb-2">Regression (Coming Soon)</h2>
      <p className="text-sm text-gray-500">
        This is a skeleton UI. You can later wire it to a regression API using <code>team_daily_stats</code>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Team selector (optional per model) */}
        <div>
          <label className="block text-xs font-semibold mb-1">Team (optional)</label>
          <input
            type="text"
            placeholder="Team ID or name..."
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="border rounded px-2 py-1 text-sm w-full"
          />
        </div>

        {/* Features */}
        <div>
          <label className="block text-xs font-semibold mb-1">Features</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_FEATURES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFeature(f)}
                className={`px-2 py-1 rounded text-xs border 
                  ${selectedFeatures.includes(f) ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-800'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Target */}
        <div>
          <label className="block text-xs font-semibold mb-1">Target variable</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as StatKey)}
            className="border rounded px-2 py-1 text-sm w-full"
          >
            {TARGET_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={handleRun}
        className="px-4 py-2 rounded bg-blue-600 text-white text-sm"
      >
        Run Regression (UI only)
      </button>

      {status && (
        <div className="mt-2 text-xs text-gray-600 border-t pt-2">
          {status}
        </div>
      )}
    </section>
  );
};
