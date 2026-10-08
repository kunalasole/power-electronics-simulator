/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Gauge } from 'lucide-react';

interface ControlsBarProps {
  isRunning: boolean;
  onToggleRun: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onResetAngle: () => void;
  speed: number;
  onChangeSpeed: (newSpeed: number) => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  isRunning,
  onToggleRun,
  onStepBack,
  onStepForward,
  onResetAngle,
  speed,
  onChangeSpeed,
}) => {
  const speedOptions = [0.1, 0.25, 0.5, 1.0, 2.0];

  return (
    <div className="h-12 shrink-0 flex items-center justify-between px-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-sm gap-3 overflow-x-auto whitespace-nowrap scrollbar-none select-none">
      {/* Playback Transport Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleRun}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all shadow-md ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          <span>{isRunning ? 'Pause Simulation' : 'Run Real-Time'}</span>
        </button>

        <button
          onClick={onStepBack}
          title="Step Backward (5°)"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onStepForward}
          title="Step Forward (5°)"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={onResetAngle}
          title="Reset Electrical Angle to 0°"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Speed Slider & Quick Chips */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span>Speed:</span>
        </div>

        <input
          type="range"
          min="0.05"
          max="2.5"
          step="0.05"
          value={speed}
          onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
          className="w-24 sm:w-36 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />

        <span className="text-xs font-mono font-bold text-cyan-400 min-w-[36px]">
          {speed.toFixed(1)}x
        </span>

        {/* Quick Speed Chips */}
        <div className="hidden sm:flex items-center gap-1">
          {speedOptions.map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
                Math.abs(speed - s) < 0.05
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
