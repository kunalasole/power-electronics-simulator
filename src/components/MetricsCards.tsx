/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimulationMetrics } from '../types';
import { Zap, Activity, Gauge, Flame, Percent, AlertTriangle, CheckCircle } from 'lucide-react';

interface MetricsCardsProps {
  metrics: SimulationMetrics;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Avg DC Voltage */}
      <div className="flex flex-col p-3 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-400">Avg DC Voltage</span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
            V_dc
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-xl font-bold font-mono tracking-tight text-white">
            {metrics.avgVoltage.toFixed(1)}
          </span>
          <span className="text-xs font-mono text-slate-400">V</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 mt-1.5 flex items-center gap-1 truncate">
          <span>V_rms =</span>
          <span className="text-slate-200 font-semibold">{metrics.rmsVoltage.toFixed(1)} V</span>
        </div>
      </div>

      {/* 2. Avg DC Current */}
      <div className="flex flex-col p-3 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-400">Avg DC Current</span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
            I_dc
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-xl font-bold font-mono tracking-tight text-emerald-400">
            {metrics.avgCurrent.toFixed(2)}
          </span>
          <span className="text-xs font-mono text-slate-400">A</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 mt-1.5 flex items-center gap-1 truncate">
          <span>I_rms =</span>
          <span className="text-slate-200 font-semibold">{metrics.rmsCurrent.toFixed(2)} A</span>
        </div>
      </div>

      {/* 3. Output Power */}
      <div className="flex flex-col p-3 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-400">Output Power</span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-amber-950 text-amber-400 border border-amber-800/60">
            P_load
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-xl font-bold font-mono tracking-tight text-amber-400">
            {metrics.activePower.toFixed(1)}
          </span>
          <span className="text-xs font-mono text-slate-400">W</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 mt-1.5 flex items-center gap-1 truncate">
          <span>S_in =</span>
          <span className="text-slate-200 font-semibold">{metrics.apparentPower.toFixed(0)} VA</span>
        </div>
      </div>

      {/* 4. Power Factor */}
      <div className="flex flex-col p-3 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-400">Power Factor</span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-purple-950 text-purple-400 border border-purple-800/60">
            PF
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-xl font-bold font-mono tracking-tight text-purple-400">
            {metrics.powerFactor.toFixed(3)}
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 mt-1.5 flex items-center gap-1 truncate">
          <span>cos(φ1) =</span>
          <span className="text-slate-200 font-semibold">{metrics.displacementFactor.toFixed(3)}</span>
        </div>
      </div>

      {/* 5. Ripple Factor */}
      <div className="flex flex-col p-3 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-400">Ripple Factor</span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-rose-950 text-rose-400 border border-rose-800/60">
            RF
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-xl font-bold font-mono tracking-tight text-rose-400">
            {metrics.rippleFactor.toFixed(3)}
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 mt-1.5 flex items-center gap-1 truncate">
          <span>Form Factor FF =</span>
          <span className="text-slate-200 font-semibold">{metrics.formFactor.toFixed(2)}</span>
        </div>
      </div>

      {/* 6. Source THD_i */}
      <div className="flex flex-col p-3 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-400">Source THD_i</span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
            THD
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-xl font-bold font-mono tracking-tight text-cyan-400">
            {metrics.thdCurrent.toFixed(1)}
          </span>
          <span className="text-xs font-mono text-slate-400">%</span>
        </div>
        <div className="text-[10px] font-mono mt-1.5 flex items-center gap-1 truncate">
          {metrics.isContinuousConduction ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>CCM Mode</span>
            </span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>DCM Mode</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
