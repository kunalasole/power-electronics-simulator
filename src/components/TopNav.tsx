/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Zap,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  BookOpen,
  Calculator,
  Sparkles,
  RotateCcw,
  Download,
} from 'lucide-react';

interface TopNavProps {
  onOpenDerivations: () => void;
  onOpenPresets: () => void;
  onOpenTheory: () => void;
  onReset: () => void;
  onExportCsv: () => void;
  isStudioFullscreen: boolean;
  onToggleStudioFullscreen: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenDerivations,
  onOpenPresets,
  onOpenTheory,
  onReset,
  onExportCsv,
  isStudioFullscreen,
  onToggleStudioFullscreen,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-slate-950/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      {/* Zone 1: Single Brand Wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-400 flex items-center justify-center shadow-md shadow-cyan-900/30">
          <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold tracking-tight text-white font-sans">
              Rectifier Lab
            </span>
            <span className="text-xs text-slate-300 font-medium">
              by <span className="text-cyan-400 font-semibold">Kunal Asole</span> <span className="text-slate-400 font-mono text-[11px]">(24EE10017)</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold uppercase hidden sm:inline-block">
              Power Electronics Studio
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            Interactive Single-Phase & Three-Phase Diode/Thyristor Bridge Converter Simulation
          </p>
        </div>
      </div>

      {/* Zone 2: Navigation & Studio Modals */}
      <nav className="flex items-center gap-2">
        <button
          onClick={onToggleDarkMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-colors"
          title="Toggle Light / Dark Mode"
        >
          {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-cyan-400" />}
          <span className="hidden sm:inline">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          onClick={onToggleStudioFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-colors"
          title="Full Screen Studio"
        >
          {isStudioFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
          <span className="hidden sm:inline">{isStudioFullscreen ? 'Exit Full Screen' : 'Full Screen Studio'}</span>
        </button>

        <button
          onClick={onOpenDerivations}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 hover:text-amber-200 text-xs font-medium border border-amber-800/60 transition-colors"
        >
          <Calculator className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Waveform Analysis & Derivations</span>
          <span className="md:hidden">Derivations</span>
        </button>

        <button
          onClick={onOpenPresets}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Presets</span>
        </button>

        <button
          onClick={onOpenTheory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span>Theory</span>
        </button>

        <button
          onClick={onExportCsv}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-colors"
          title="Export Waveform Data as CSV"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export CSV</span>
        </button>

        <button
          onClick={onReset}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          title="Reset Parameters to Default"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </nav>
    </header>
  );
};
