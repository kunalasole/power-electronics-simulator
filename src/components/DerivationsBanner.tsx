/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CircuitParameters, SimulationMetrics } from '../types';
import { BookOpen, ExternalLink, Calculator } from 'lucide-react';

interface DerivationsBannerProps {
  params: CircuitParameters;
  metrics: SimulationMetrics;
  onOpenDerivations: () => void;
}

export const DerivationsBanner: React.FC<DerivationsBannerProps> = ({
  params,
  metrics,
  onOpenDerivations,
}) => {
  const is1P = params.phase === '1phase';
  const isFull = params.topology === 'full-bridge';

  let bannerTitle = '';
  let bannerDesc = '';

  if (is1P && isFull) {
    if (params.hasFreewheelingDiode) {
      bannerTitle = '1-Phase Semi-Converter / Bridge with FWD — Analytical DC Voltage Equation';
      bannerDesc = 'One-quadrant operation with freewheeling action clamping negative voltage spikes to 0V.';
    } else {
      bannerTitle = '1-Phase Fully-Controlled Bridge Converter — Analytical DC Voltage Equation';
      bannerDesc = 'Two-quadrant converter. For continuous conduction, allows negative instantaneous voltage output.';
    }
  } else if (is1P && !isFull) {
    bannerTitle = '1-Phase Half-Wave Controlled Rectifier — Analytical DC Voltage Equation';
    bannerDesc = 'Single-quadrant half-wave rectifier with periodic conduction across positive half-cycle.';
  } else if (!is1P && isFull) {
    bannerTitle = '3-Phase 6-Pulse Full-Bridge Converter — Analytical DC Voltage Equation';
    bannerDesc = 'Industrial 6-pulse bridge with commutation handoff every 60° (π/3 radians) across line pairs.';
  } else {
    bannerTitle = '3-Phase 3-Pulse Half-Wave (Midpoint) Converter — Analytical DC Voltage Equation';
    bannerDesc = 'Star-connected 3-phase rectifier with neutral line return. Pulse number p = 3.';
  }

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-sm gap-4">
      {/* Left: Description & Theory Link */}
      <div className="flex items-start gap-3 flex-1">
        <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 shrink-0 mt-0.5">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-100 tracking-wide">
              {bannerTitle}
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{bannerDesc}</p>
        </div>
      </div>

      {/* Right: Theoretical Formula & Ideal Value */}
      <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-lg shrink-0 w-full lg:w-auto justify-between lg:justify-end">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold tracking-wider uppercase text-slate-400">
            Theoretical Formula
          </span>
          <span className="text-xs font-mono font-semibold text-cyan-300 mt-0.5">
            {metrics.idealFormulaText}
          </span>
        </div>

        <div className="h-7 w-[1px] bg-slate-800" />

        <div className="flex flex-col text-right">
          <span className="text-[9px] font-bold tracking-wider uppercase text-slate-400">
            Ideal Theoretical V_dc
          </span>
          <span className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
            {metrics.theoreticalAvgVoltage.toFixed(1)} V
          </span>
        </div>

        <button
          onClick={onOpenDerivations}
          title="Open Mathematical Derivations & Proofs"
          className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700/60 transition-colors"
        >
          <Calculator className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Derivations</span>
        </button>
      </div>
    </div>
  );
};
