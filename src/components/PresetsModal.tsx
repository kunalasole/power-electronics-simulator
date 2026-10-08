/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PRESETS, PresetConfig } from '../simulation/theory';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetConfig) => void;
  activePresetId?: string;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  activePresetId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/60">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Converter Presets & Lab Scenarios</h2>
              <p className="text-xs text-slate-400">
                Load benchmark laboratory circuits and industry configurations in one click
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Cards List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-slate-900">
          {PRESETS.map((preset) => {
            const isCurrent = activePresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                  isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                      {preset.category}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {preset.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {preset.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
                    <span>V_rms: {preset.params.sourceRms}V</span>
                    <span>•</span>
                    <span>Load: {preset.params.loadType} (R={preset.params.resistance}Ω, L={preset.params.inductance}mH)</span>
                    <span>•</span>
                    <span>α: {preset.params.firingAngle}°</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {isCurrent ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 group-hover:bg-cyan-600 text-slate-300 group-hover:text-white text-xs font-semibold transition-colors">
                      <span>Load</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
