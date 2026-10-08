/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, BookOpen, Cpu, ShieldCheck, Zap, Activity } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'quadrants' | 'fwd' | 'metrics'>('basics');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col w-full max-w-4xl max-h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Power Electronics Theory Guide</h2>
              <p className="text-xs text-slate-400">
                Operating physics of phase-controlled rectifiers, thyristors, and commutation mechanisms
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 shrink-0 overflow-x-auto">
          {[
            { id: 'basics', label: 'Diode vs Thyristor (SCR)' },
            { id: 'quadrants', label: 'Quadrants & Inversion Mode' },
            { id: 'fwd', label: 'Freewheeling Diode (FWD)' },
            { id: 'metrics', label: 'Power Quality & Harmonics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed bg-slate-900">
          {activeTab === 'basics' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">
                Uncontrolled (Diode) vs Controlled (Thyristor / SCR) Converters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                    Power Diode (Uncontrolled)
                  </h4>
                  <p className="text-xs text-slate-300">
                    A power diode turns ON automatically when forward biased (anode potential exceeds cathode potential, V_AK &gt; 0) and turns OFF when current drops to zero (reverse biased). The firing angle is fixed at α = 0°.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <li>• Natural commutation occurs at AC voltage zero crossings.</li>
                    <li>• Fixed DC output voltage determined solely by AC supply magnitude.</li>
                    <li>• High efficiency but no voltage regulation capability.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                    Thyristor / SCR (Phase-Controlled)
                  </h4>
                  <p className="text-xs text-slate-300">
                    A Silicon-Controlled Rectifier (SCR) remains in a forward blocking state even when forward biased (V_AK &gt; 0) until a gate trigger current pulse is applied at electrical delay angle α (ωt = α).
                  </p>
                  <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <li>• Turn-off occurs only when anode current drops below the holding current (I_H ≈ 0).</li>
                    <li>• Natural line commutation: AC source voltage reverses, forcing current to zero.</li>
                    <li>• Firing angle α can be varied from 0° to 180° for continuous DC voltage control.</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  Condition for Thyristor Triggering
                </h4>
                <p className="text-xs text-slate-300">
                  1. Anode must be positive with respect to cathode (V_AK &gt; 0).<br />
                  2. A gate trigger pulse with adequate magnitude and duration must be delivered.<br />
                  3. The anode current must exceed the latching current (I_L) before the gate pulse is removed.<br />
                  4. For an RLE load (e.g., DC motor or battery charger), the AC source instantaneous voltage must be greater than the Back-EMF E at the firing instant; otherwise, the device remains reverse biased.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'quadrants' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">
                Quadrants of Operation & Line-Commutated Inversion
              </h3>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-full md:w-1/2 p-4 bg-slate-900 rounded-lg border border-slate-800 text-center font-mono text-xs">
                    <div className="font-bold text-cyan-400 mb-2">V-I Quadrant Plane</div>
                    <div className="grid grid-cols-2 gap-2 h-40">
                      <div className="border border-slate-800 p-2 flex flex-col justify-center items-center bg-slate-950/60">
                        <span className="text-slate-500 font-bold">Quadrant II</span>
                        <span className="text-[10px] text-slate-500">V &gt; 0, I &lt; 0 (Not Possible in Bridge)</span>
                      </div>
                      <div className="border border-emerald-800 p-2 flex flex-col justify-center items-center bg-emerald-950/40">
                        <span className="text-emerald-400 font-bold">Quadrant I: Rectification</span>
                        <span className="text-[10px] text-emerald-300">0° ≤ α &lt; 90° (V &gt; 0, I &gt; 0)</span>
                      </div>
                      <div className="border border-slate-800 p-2 flex flex-col justify-center items-center bg-slate-950/60">
                        <span className="text-slate-500 font-bold">Quadrant III</span>
                        <span className="text-[10px] text-slate-500">V &lt; 0, I &lt; 0 (Not Possible)</span>
                      </div>
                      <div className="border border-purple-800 p-2 flex flex-col justify-center items-center bg-purple-950/40">
                        <span className="text-purple-400 font-bold">Quadrant IV: Inversion</span>
                        <span className="text-[10px] text-purple-300">90° &lt; α &lt; 180° (V &lt; 0, I &gt; 0)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-xs">
                    <h4 className="font-bold text-slate-200">Two-Quadrant Operation Explained:</h4>
                    <p className="text-slate-300">
                      Because thyristors conduct current in only one direction (anode to cathode, io ≥ 0), the converter cannot operate in Quadrants II or III without a dual anti-parallel bridge.
                    </p>
                    <p className="text-slate-300">
                      • When α &lt; 90°: V_dc = (2·V_m / π)·cos α &gt; 0. Net power P = V_dc · I_dc &gt; 0 flows from AC supply to the DC load (Rectifier Mode).
                    </p>
                    <p className="text-slate-300">
                      • When α &gt; 90°: V_dc &lt; 0. If an external DC source (such as a regenerative DC motor or battery) is connected with correct polarity, net power P &lt; 0 flows from the DC side back into the AC grid (Line-Commutated Inverter Mode).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fwd' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">
                The Role & Benefits of the Freewheeling Diode (D_FW)
              </h3>

              <p className="text-xs text-slate-300">
                When supplying an inductive load (RL or RLE), the stored magnetic energy in the inductor (E_L = ½ L · i²) attempts to maintain continuous current flow even after the AC source voltage reverses.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 block mb-1">
                    1. Prevents Negative Voltage
                  </span>
                  <p className="text-xs text-slate-400">
                    As soon as the source voltage drops below zero, the freewheeling diode forward-biases and clamps the load terminal voltage to 0 V, preventing negative voltage excursions.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-bold text-cyan-400 block mb-1">
                    2. Improves Average DC Voltage
                  </span>
                  <p className="text-xs text-slate-400">
                    By eliminating negative voltage spikes, the average DC output voltage increases from (2·V_m / π)·cos α to (V_m / π)·(1 + cos α).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-bold text-amber-400 block mb-1">
                    3. Boosts Input Power Factor
                  </span>
                  <p className="text-xs text-slate-400">
                    During the freewheeling interval, current circulates locally within the load and diode. The AC source current remains zero, improving the input displacement factor.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">
                Power Quality & Performance Parameter Definitions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-bold text-cyan-400 block mb-1">
                    Form Factor (FF) & Ripple Factor (RF)
                  </span>
                  <div className="font-mono text-xs text-slate-200 mt-1">
                    FF = V_rms / V_dc<br />
                    RF = √(FF² - 1) = √( (V_rms / V_dc)² - 1 )
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    For a pure ripple-free DC output, $FF = 1.0$ and $RF = 0$. Lower ripple factor indicates higher rectification quality.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-bold text-purple-400 block mb-1">
                    Total Harmonic Distortion (THD)
                  </span>
                  <div className="font-mono text-xs text-slate-200 mt-1">
                    THD_i = √( Σ I_n² ) / I_1 × 100%
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Measures the distortion of the non-sinusoidal AC supply current compared to the fundamental 50/60 Hz component.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
