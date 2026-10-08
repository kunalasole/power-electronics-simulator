/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DERIVATIONS_LIBRARY } from '../simulation/theory';
import { X, BookOpen, Calculator, CheckCircle2 } from 'lucide-react';

interface DerivationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DerivationsModal: React.FC<DerivationsModalProps> = ({ isOpen, onClose }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!isOpen) return null;

  const currentTopic = DERIVATIONS_LIBRARY[selectedIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col w-full max-w-4xl max-h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Waveform Analysis & Derivations</h2>
              <p className="text-xs text-slate-400">
                Rigorous mathematical proofs and integral calculus for power converter topologies
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

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Topic Selector */}
          <div className="w-full md:w-72 bg-slate-950/60 border-r border-slate-800/80 p-3 overflow-y-auto space-y-1.5 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
              Topologies
            </span>
            {DERIVATIONS_LIBRARY.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  selectedIdx === idx
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="font-semibold truncate">{item.topology}</div>
                <div className="text-[11px] opacity-80 truncate mt-0.5">{item.title}</div>
              </button>
            ))}
          </div>

          {/* Right Detailed Derivation View */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                {currentTopic.topology}
              </span>
              <h3 className="text-lg font-bold text-white mt-1">{currentTopic.title}</h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                {currentTopic.summary}
              </p>
            </div>

            {/* Formula Callout Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Average DC Voltage */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Average DC Output Voltage (V_dc)
                </span>
                <div className="mt-2 text-base font-mono font-bold text-emerald-400 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                  {currentTopic.resultFormula}
                </div>
              </div>

              {/* RMS Output Voltage */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  RMS Output Voltage (V_rms)
                </span>
                <div className="mt-2 text-base font-mono font-bold text-purple-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                  {currentTopic.rmsFormula}
                </div>
              </div>
            </div>

            {/* Step-by-Step Integral Derivation */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Definite Integral Step
              </h4>
              <div className="bg-slate-900 p-3 rounded-lg font-mono text-sm text-cyan-200 border border-slate-800/80 overflow-x-auto">
                {currentTopic.integralStep}
              </div>
            </div>

            {/* Engineering Notes & Operating Constraints */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Key Operating Physics & Constraints
              </h4>
              <ul className="space-y-2">
                {currentTopic.notes.map((note, nIdx) => (
                  <li key={nIdx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Derivations
          </button>
        </div>
      </div>
    </div>
  );
};
