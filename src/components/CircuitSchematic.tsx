/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CircuitParameters, InstantaneousState, SwitchDeviceType } from '../types';
import { Maximize2, Minimize2, Zap, ArrowRight, Power } from 'lucide-react';

interface CircuitSchematicProps {
  params: CircuitParameters;
  state: InstantaneousState;
  onToggleSwitch: (switchId: string) => void;
  onToggleFwd: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  darkMode?: boolean;
}

export const CircuitSchematic: React.FC<CircuitSchematicProps> = ({
  params,
  state,
  onToggleSwitch,
  onToggleFwd,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const { phase, topology, hasFreewheelingDiode, loadType, resistance, inductance, backEmf, sourceRms, switches } = params;
  const is1P = phase === '1phase';
  const isFull = topology === 'full-bridge';

  // Compute live current loops
  const conducting = state.conductingSwitches;
  const isT1On = conducting.includes('T1');
  const isT2On = conducting.includes('T2');
  const isT3On = conducting.includes('T3');
  const isT4On = conducting.includes('T4');
  const isT5On = conducting.includes('T5');
  const isT6On = conducting.includes('T6');
  const isFwdOn = state.isFreewheeling;

  const currentIoFormatted = state.outputCurrent.toFixed(2);
  const currentVoFormatted = state.outputVoltage.toFixed(1);

  // Topology badge title
  const topologyTitle = is1P
    ? isFull
      ? '1-PHASE FULL-BRIDGE'
      : '1-PHASE HALF-WAVE'
    : isFull
    ? '3-PHASE 6-PULSE BRIDGE'
    : '3-PHASE 3-PULSE HALF-WAVE';

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
      {/* Header Bar - Fixed height & stable layout to eliminate oscillation */}
      <div className="h-11 shrink-0 flex items-center justify-between px-3 sm:px-4 bg-slate-950/80 border-b border-slate-800 overflow-hidden select-none">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold tracking-wide bg-cyan-950 text-cyan-400 border border-cyan-800/60 shrink-0">
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Circuit Schematic</span>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800/80 text-emerald-400 border border-emerald-900/40 shrink-0 whitespace-nowrap">
            {topologyTitle}
          </span>
          <span className="hidden xl:inline text-xs text-slate-400 truncate">
            Click any device to toggle Diode ↔ Thyristor
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Active loop indicator - rigid width prevents layout reflow oscillation */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700/60 w-44 sm:w-56 shrink-0 overflow-hidden">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isFwdOn
                  ? 'bg-amber-400'
                  : conducting.length > 0
                  ? 'bg-emerald-400'
                  : 'bg-slate-600'
              }`}
            />
            <span className="text-xs font-mono font-medium text-slate-200 truncate select-none">
              {state.activeLoopDescription}
            </span>
          </div>

          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Schematic'}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* SVG Circuit Canvas Area */}
      <div className="relative flex-1 min-h-[340px] w-full flex items-center justify-center p-2 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 overflow-hidden select-none">
        {/* Animated electron glow overlay */}
        <svg
          viewBox="0 0 880 440"
          className="w-full h-full max-h-[460px] object-contain"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="busPositive" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f87171" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="busNegative" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
            </linearGradient>

            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Current animation style */}
            <style>
              {`
                @keyframes pulseDash {
                  from { stroke-dashoffset: 40; }
                  to { stroke-dashoffset: 0; }
                }
                .flow-active {
                  stroke: #10b981 !important;
                  stroke-width: 3.5px !important;
                  stroke-dasharray: 8 6;
                  animation: pulseDash 0.8s linear infinite;
                  filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.7));
                }
                .flow-fwd {
                  stroke: #f59e0b !important;
                  stroke-width: 3.5px !important;
                  stroke-dasharray: 8 6;
                  animation: pulseDash 0.8s linear infinite;
                  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.7));
                }
              `}
            </style>
          </defs>

          {/* Background Grid Lines (Subtle) */}
          <g opacity="0.07" stroke="#94a3b8" strokeWidth="0.5">
            {Array.from({ length: 22 }).map((_, i) => (
              <line key={`vg-${i}`} x1={i * 40} y1="0" x2={i * 40} y2="440" />
            ))}
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`hg-${i}`} x1="0" y1={i * 40} x2="880" y2={i * 40} />
            ))}
          </g>

          {/* Render Schematics depending on topology */}
          {is1P && isFull && render1PhaseFullBridge()}
          {is1P && !isFull && render1PhaseHalfWave()}
          {!is1P && isFull && render3PhaseFullBridge()}
          {!is1P && !isFull && render3PhaseHalfWave()}
        </svg>

        {/* Floating Quick Live Metrics Pin on Diagram */}
        <div className="absolute bottom-3 left-4 flex items-center gap-2 sm:gap-3 bg-slate-950/80 border border-slate-800/80 px-3 py-1.5 rounded-lg text-xs font-mono shadow-lg backdrop-blur select-none">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span>+Vo:</span>
            <span className="text-emerald-400 font-bold tabular-nums inline-block min-w-[50px]">{currentVoFormatted} V</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
            <span>Io:</span>
            <span className="text-amber-400 font-bold tabular-nums inline-block min-w-[48px]">{currentIoFormatted} A</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-cyan-400">ωt:</span>
            <span className="text-white tabular-nums inline-block min-w-[46px]">{state.angleDeg.toFixed(1)}°</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // 1-PHASE FULL BRIDGE SCHEMATIC
  // ----------------------------------------------------
  function render1PhaseFullBridge() {
    const busYTop = 90;
    const busYBottom = 350;
    const bridgeX1 = 280; // Left branch: T1 (top) and T4 (bottom)
    const bridgeX2 = 460; // Right branch: T3 (top) and T2 (bottom)
    const fwdX = 580; // Freewheeling diode
    const loadX = 720; // Load location
    const sourceX = 120; // AC Source

    return (
      <g>
        {/* +DC Rail (Top bus) */}
        {/* Segment between T1 and T3: In negative half-cycle (T3 ON), current originates at T3 towards load, so NO current in wire between T1 and T3 */}
        <line
          x1={bridgeX1}
          y1={busYTop}
          x2={bridgeX2}
          y2={busYTop}
          stroke={isT1On ? '#10b981' : '#334155'}
          strokeWidth="3"
          className={isT1On ? 'flow-active' : ''}
        />
        {/* Segment from T3 to Load: carries current if either T1 or T3 conducts */}
        <line
          x1={bridgeX2}
          y1={busYTop}
          x2={loadX}
          y2={busYTop}
          stroke={isT1On || isT3On ? '#10b981' : '#334155'}
          strokeWidth="3"
          className={isT1On || isT3On ? 'flow-active' : ''}
        />
        <text x={loadX + 10} y={busYTop + 5} fill="#f87171" fontSize="12" fontWeight="bold" fontFamily="monospace">
          + Vo ({currentVoFormatted} V)
        </text>

        {/* -DC Rail (Bottom bus / GND) */}
        {/* Segment between T4 and T2: In positive half-cycle (T2 ON), return current enters T2, so NO current in wire between T2 and T4 */}
        <line
          x1={bridgeX1}
          y1={busYBottom}
          x2={bridgeX2}
          y2={busYBottom}
          stroke={isT4On ? '#10b981' : '#334155'}
          strokeWidth="3"
          className={isT4On ? 'flow-active' : ''}
        />
        {/* Segment from T2 to Load: carries return current if either T2 or T4 conducts */}
        <line
          x1={bridgeX2}
          y1={busYBottom}
          x2={loadX}
          y2={busYBottom}
          stroke={isT2On || isT4On ? '#10b981' : '#334155'}
          strokeWidth="3"
          className={isT2On || isT4On ? 'flow-active' : ''}
        />
        <text x={loadX + 10} y={busYBottom + 5} fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
          - Vo (GND)
        </text>

        {/* AC Source Left */}
        {renderACSource(sourceX, 220, 'Phase A', sourceRms, state.sourceVoltages.va)}

        {/* Connection from Source to Bridge Branch 1 (Midpoint T1-T4) */}
        {/* Line 1: Source Top terminal (sourceX, 175) to Bridge 1 Midpoint (bridgeX1, 220) */}
        <path
          d={`M ${sourceX} 175 L ${sourceX} 220 L ${bridgeX1} 220`}
          fill="none"
          stroke={isT1On ? '#10b981' : isT4On ? '#10b981' : '#475569'}
          strokeWidth="2.5"
          className={isT1On || isT4On ? 'flow-active' : ''}
        />

        {/* Connection from Source Bottom terminal to Bridge Branch 2 (Midpoint T3-T2) */}
        <path
          d={`M ${sourceX} 265 L ${sourceX} 290 L ${bridgeX2} 290 L ${bridgeX2} 220`}
          fill="none"
          stroke={isT2On ? '#10b981' : isT3On ? '#10b981' : '#475569'}
          strokeWidth="2.5"
          className={isT2On || isT3On ? 'flow-active' : ''}
        />

        {/* Left Bridge Arm: T1 (Top) and T4 (Bottom) */}
        {/* Wire top to T1 - Current only flows here when T1 is ON */}
        <line
          x1={bridgeX1}
          y1={busYTop}
          x2={bridgeX1}
          y2={130}
          stroke={isT1On ? '#10b981' : '#334155'}
          strokeWidth="2.5"
          className={isT1On ? 'flow-active' : ''}
        />
        {renderSwitchDevice(bridgeX1, 155, 'T1', switches['T1'], isT1On, 'Top')}
        {/* Wire between T1 cathode/anode and branch midpoint 220 - Only carries current when T1 is ON */}
        <line
          x1={bridgeX1}
          y1={180}
          x2={bridgeX1}
          y2={220}
          stroke={isT1On ? '#10b981' : '#334155'}
          strokeWidth="2.5"
          className={isT1On ? 'flow-active' : ''}
        />

        {/* Wire between branch midpoint 220 and T4 - Only carries current when T4 is ON */}
        <line
          x1={bridgeX1}
          y1={220}
          x2={bridgeX1}
          y2={260}
          stroke={isT4On ? '#10b981' : '#334155'}
          strokeWidth="2.5"
          className={isT4On ? 'flow-active' : ''}
        />
        {renderSwitchDevice(bridgeX1, 285, 'T4', switches['T4'], isT4On, 'Bottom')}
        {/* Wire bottom out from T4 to -DC rail - Only carries current when T4 is ON */}
        <line
          x1={bridgeX1}
          y1={310}
          x2={bridgeX1}
          y2={busYBottom}
          stroke={isT4On ? '#10b981' : '#334155'}
          strokeWidth="2.5"
          className={isT4On ? 'flow-active' : ''}
        />

        {/* Right Bridge Arm: T3 (Top) and T2 (Bottom) */}
        {/* Wire top to T3 - Current only flows here when T3 is ON */}
        <line
          x1={bridgeX2}
          y1={busYTop}
          x2={bridgeX2}
          y2={130}
          stroke={isT3On ? '#10b981' : '#334155'}
          strokeWidth="2.5"
          className={isT3On ? 'flow-active' : ''}
        />
        {renderSwitchDevice(bridgeX2, 155, 'T3', switches['T3'], isT3On, 'Top')}
        {/* Wire between T3 and branch midpoint 220 - Only carries current when T3 is ON */}
        <line
          x1={bridgeX2}
          y1={180}
          x2={bridgeX2}
          y2={220}
          stroke={isT3On ? '#10b981' : '#334155'}
          strokeWidth="2.5"
          className={isT3On ? 'flow-active' : ''}
        />

        {/* Wire between branch midpoint 220 and T2 - Only carries current when T2 is ON */}
        <line
          x1={bridgeX2}
          y1={220}
          x2={bridgeX2}
          y2={260}
          stroke={isT2On ? '#10b981' : '#334155'}
          strokeWidth="2.5"
          className={isT2On ? 'flow-active' : ''}
        />
        {renderSwitchDevice(bridgeX2, 285, 'T2', switches['T2'], isT2On, 'Bottom')}
        {/* Wire bottom out from T2 to -DC rail - Only carries current when T2 is ON */}
        <line
          x1={bridgeX2}
          y1={310}
          x2={bridgeX2}
          y2={busYBottom}
          stroke={isT2On ? '#10b981' : '#334155'}
          strokeWidth="2.5"
          className={isT2On ? 'flow-active' : ''}
        />

        {/* Junction Nodes */}
        <circle cx={bridgeX1} cy={busYTop} r="4" fill="#38bdf8" />
        <circle cx={bridgeX2} cy={busYTop} r="4" fill="#38bdf8" />
        <circle cx={bridgeX1} cy={busYBottom} r="4" fill="#38bdf8" />
        <circle cx={bridgeX2} cy={busYBottom} r="4" fill="#38bdf8" />
        <circle cx={bridgeX1} cy={220} r="4" fill="#38bdf8" />
        <circle cx={bridgeX2} cy={220} r="4" fill="#38bdf8" />

        {/* Freewheeling Diode (D_FW) */}
        {renderFreewheelingDiode(fwdX, busYTop, busYBottom, hasFreewheelingDiode, isFwdOn)}

        {/* Load Branch */}
        {renderLoadBranch(loadX, busYTop, busYBottom, loadType, resistance, inductance, backEmf, state.outputCurrent)}
      </g>
    );
  }

  // ----------------------------------------------------
  // 1-PHASE HALF-WAVE SCHEMATIC
  // ----------------------------------------------------
  function render1PhaseHalfWave() {
    const busYTop = 130;
    const busYBottom = 330;
    const switchX = 350;
    const fwdX = 520;
    const loadX = 680;
    const sourceX = 140;

    return (
      <g>
        {/* Source */}
        {renderACSource(sourceX, 230, 'Phase A', sourceRms, state.sourceVoltages.va)}

        {/* Line from source to switch */}
        <path
          d={`M ${sourceX} 185 L ${sourceX} ${busYTop} L ${switchX - 35} ${busYTop}`}
          fill="none"
          stroke={isT1On ? '#10b981' : '#475569'}
          strokeWidth="2.5"
          className={isT1On ? 'flow-active' : ''}
        />

        {/* Switch T1 in series */}
        <g transform={`rotate(-90 ${switchX} ${busYTop})`}>
          {renderSwitchDevice(switchX, busYTop, 'T1', switches['T1'], isT1On, 'Series')}
        </g>

        {/* Line from switch to load */}
        <line
          x1={switchX + 35}
          y1={busYTop}
          x2={loadX}
          y2={busYTop}
          stroke={isT1On ? '#10b981' : '#334155'}
          strokeWidth="2.5"
          className={isT1On ? 'flow-active' : ''}
        />
        <text x={loadX + 10} y={busYTop + 5} fill="#f87171" fontSize="12" fontWeight="bold" fontFamily="monospace">
          + Vo ({currentVoFormatted} V)
        </text>

        {/* Neutral return bus from load back to source bottom */}
        <path
          d={`M ${loadX} ${busYBottom} L ${sourceX} ${busYBottom} L ${sourceX} 275`}
          fill="none"
          stroke={isT1On ? '#10b981' : '#475569'}
          strokeWidth="2.5"
          className={isT1On ? 'flow-active' : ''}
        />
        <text x={loadX + 10} y={busYBottom + 5} fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
          Neutral / GND
        </text>

        {/* Freewheeling Diode */}
        {renderFreewheelingDiode(fwdX, busYTop, busYBottom, hasFreewheelingDiode, isFwdOn)}

        {/* Load */}
        {renderLoadBranch(loadX, busYTop, busYBottom, loadType, resistance, inductance, backEmf, state.outputCurrent)}
      </g>
    );
  }

  // ----------------------------------------------------
  // 3-PHASE FULL BRIDGE SCHEMATIC (6-PULSE)
  // ----------------------------------------------------
  function render3PhaseFullBridge() {
    const busYTop = 80;
    const busYBottom = 360;
    const b1X = 260; // T1 / T4 (Phase A)
    const b2X = 390; // T3 / T6 (Phase B)
    const b3X = 520; // T5 / T2 (Phase C)
    const fwdX = 620;
    const loadX = 740;

    return (
      <g>
        {/* 3-Phase Sources A, B, C */}
        {render3PhaseSource(90, 220)}

        {/* Bus Top (Segmented by branch) */}
        <line
          x1={b1X}
          y1={busYTop}
          x2={b2X}
          y2={busYTop}
          stroke={isT1On ? '#10b981' : '#334155'}
          strokeWidth="3"
          className={isT1On ? 'flow-active' : ''}
        />
        <line
          x1={b2X}
          y1={busYTop}
          x2={b3X}
          y2={busYTop}
          stroke={isT1On || isT3On ? '#10b981' : '#334155'}
          strokeWidth="3"
          className={isT1On || isT3On ? 'flow-active' : ''}
        />
        <line
          x1={b3X}
          y1={busYTop}
          x2={loadX}
          y2={busYTop}
          stroke={isT1On || isT3On || isT5On ? '#10b981' : '#334155'}
          strokeWidth="3"
          className={isT1On || isT3On || isT5On ? 'flow-active' : ''}
        />
        <text x={loadX + 10} y={busYTop + 5} fill="#f87171" fontSize="12" fontWeight="bold" fontFamily="monospace">
          + Vo ({currentVoFormatted} V)
        </text>

        {/* Bus Bottom (Segmented by branch) */}
        <line
          x1={b1X}
          y1={busYBottom}
          x2={b2X}
          y2={busYBottom}
          stroke={isT4On ? '#10b981' : '#334155'}
          strokeWidth="3"
          className={isT4On ? 'flow-active' : ''}
        />
        <line
          x1={b2X}
          y1={busYBottom}
          x2={b3X}
          y2={busYBottom}
          stroke={isT4On || isT6On ? '#10b981' : '#334155'}
          strokeWidth="3"
          className={isT4On || isT6On ? 'flow-active' : ''}
        />
        <line
          x1={b3X}
          y1={busYBottom}
          x2={loadX}
          y2={busYBottom}
          stroke={isT4On || isT6On || isT2On ? '#10b981' : '#334155'}
          strokeWidth="3"
          className={isT4On || isT6On || isT2On ? 'flow-active' : ''}
        />
        <text x={loadX + 10} y={busYBottom + 5} fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
          - Vo (GND)
        </text>

        {/* Connect Phase A to Branch 1 (b1X) */}
        <path
          d={`M 140 160 L ${b1X} 160 L ${b1X} 220`}
          fill="none"
          stroke={isT1On || isT4On ? '#10b981' : '#475569'}
          strokeWidth="2"
          className={isT1On || isT4On ? 'flow-active' : ''}
        />
        {/* Connect Phase B to Branch 2 (b2X) */}
        <path
          d={`M 140 220 L ${b2X} 220`}
          fill="none"
          stroke={isT3On || isT6On ? '#10b981' : '#475569'}
          strokeWidth="2"
          className={isT3On || isT6On ? 'flow-active' : ''}
        />
        {/* Connect Phase C to Branch 3 (b3X) */}
        <path
          d={`M 140 280 L ${b3X} 280 L ${b3X} 220`}
          fill="none"
          stroke={isT5On || isT2On ? '#10b981' : '#475569'}
          strokeWidth="2"
          className={isT5On || isT2On ? 'flow-active' : ''}
        />

        {/* Branch 1: T1 & T4 */}
        <line x1={b1X} y1={busYTop} x2={b1X} y2={125} stroke={isT1On ? '#10b981' : '#334155'} strokeWidth="2" />
        {renderSwitchDevice(b1X, 150, 'T1', switches['T1'], isT1On, 'Top')}
        <line x1={b1X} y1={175} x2={b1X} y2={220} stroke={isT1On ? '#10b981' : '#334155'} strokeWidth="2" />
        <line x1={b1X} y1={220} x2={b1X} y2={265} stroke={isT4On ? '#10b981' : '#334155'} strokeWidth="2" />
        {renderSwitchDevice(b1X, 290, 'T4', switches['T4'], isT4On, 'Bottom')}
        <line x1={b1X} y1={315} x2={b1X} y2={busYBottom} stroke={isT4On ? '#10b981' : '#334155'} strokeWidth="2" />

        {/* Branch 2: T3 & T6 */}
        <line x1={b2X} y1={busYTop} x2={b2X} y2={125} stroke={isT3On ? '#10b981' : '#334155'} strokeWidth="2" />
        {renderSwitchDevice(b2X, 150, 'T3', switches['T3'], isT3On, 'Top')}
        <line x1={b2X} y1={175} x2={b2X} y2={220} stroke={isT3On ? '#10b981' : '#334155'} strokeWidth="2" />
        <line x1={b2X} y1={220} x2={b2X} y2={265} stroke={isT6On ? '#10b981' : '#334155'} strokeWidth="2" />
        {renderSwitchDevice(b2X, 290, 'T6', switches['T6'], isT6On, 'Bottom')}
        <line x1={b2X} y1={315} x2={b2X} y2={busYBottom} stroke={isT6On ? '#10b981' : '#334155'} strokeWidth="2" />

        {/* Branch 3: T5 & T2 */}
        <line x1={b3X} y1={busYTop} x2={b3X} y2={125} stroke={isT5On ? '#10b981' : '#334155'} strokeWidth="2" />
        {renderSwitchDevice(b3X, 150, 'T5', switches['T5'], isT5On, 'Top')}
        <line x1={b3X} y1={175} x2={b3X} y2={220} stroke={isT5On ? '#10b981' : '#334155'} strokeWidth="2" />
        <line x1={b3X} y1={220} x2={b3X} y2={265} stroke={isT2On ? '#10b981' : '#334155'} strokeWidth="2" />
        {renderSwitchDevice(b3X, 290, 'T2', switches['T2'], isT2On, 'Bottom')}
        <line x1={b3X} y1={315} x2={b3X} y2={busYBottom} stroke={isT2On ? '#10b981' : '#334155'} strokeWidth="2" />

        {/* Freewheeling Diode */}
        {renderFreewheelingDiode(fwdX, busYTop, busYBottom, hasFreewheelingDiode, isFwdOn)}

        {/* Load */}
        {renderLoadBranch(loadX, busYTop, busYBottom, loadType, resistance, inductance, backEmf, state.outputCurrent)}
      </g>
    );
  }

  // ----------------------------------------------------
  // 3-PHASE HALF-WAVE SCHEMATIC (3-PULSE)
  // ----------------------------------------------------
  function render3PhaseHalfWave() {
    const busYTop = 90;
    const busYBottom = 340;
    const s1X = 280;
    const s2X = 400;
    const s3X = 520;
    const loadX = 690;
    const fwdX = 590;

    return (
      <g>
        {render3PhaseSource(90, 220, true)}

        {/* Top Bus to Load */}
        <line
          x1={s1X}
          y1={busYTop}
          x2={loadX}
          y2={busYTop}
          stroke={conducting.length > 0 ? '#10b981' : '#334155'}
          strokeWidth="3"
          className={conducting.length > 0 ? 'flow-active' : ''}
        />
        <text x={loadX + 10} y={busYTop + 5} fill="#f87171" fontSize="12" fontWeight="bold" fontFamily="monospace">
          + Vo ({currentVoFormatted} V)
        </text>

        {/* Neutral Return line */}
        <path
          d={`M ${loadX} ${busYBottom} L 140 ${busYBottom} L 140 220`}
          fill="none"
          stroke={conducting.length > 0 ? '#10b981' : '#475569'}
          strokeWidth="2.5"
          className={conducting.length > 0 ? 'flow-active' : ''}
        />
        <text x={loadX + 10} y={busYBottom + 5} fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
          Neutral (N)
        </text>

        {/* Switch 1 (T1) on Phase A */}
        <path d={`M 140 160 L ${s1X} 160 L ${s1X} 125`} fill="none" stroke="#475569" strokeWidth="2" />
        {renderSwitchDevice(s1X, 107, 'T1', switches['T1'], isT1On, 'Top')}

        {/* Switch 2 (T3) on Phase B */}
        <path d={`M 140 220 L ${s2X} 220 L ${s2X} 125`} fill="none" stroke="#475569" strokeWidth="2" />
        {renderSwitchDevice(s2X, 107, 'T3', switches['T3'], isT3On, 'Top')}

        {/* Switch 3 (T5) on Phase C */}
        <path d={`M 140 280 L ${s3X} 280 L ${s3X} 125`} fill="none" stroke="#475569" strokeWidth="2" />
        {renderSwitchDevice(s3X, 107, 'T5', switches['T5'], isT5On, 'Top')}

        {/* Freewheeling Diode */}
        {renderFreewheelingDiode(fwdX, busYTop, busYBottom, hasFreewheelingDiode, isFwdOn)}

        {/* Load */}
        {renderLoadBranch(loadX, busYTop, busYBottom, loadType, resistance, inductance, backEmf, state.outputCurrent)}
      </g>
    );
  }

  // ----------------------------------------------------
  // SUB-COMPONENTS & SVG SYMBOLS
  // ----------------------------------------------------

  function renderACSource(cx: number, cy: number, label: string, vRms: number, instV: number) {
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r="38"
          fill="#090d16"
          stroke="#0284c7"
          strokeWidth="2.5"
          filter="drop-shadow(0 0 8px rgba(2, 132, 199, 0.4))"
        />
        {/* Sine Wave Curve inside */}
        <path
          d={`M ${cx - 20} ${cy} Q ${cx - 10} ${cy - 18} ${cx} ${cy} T ${cx + 20} ${cy}`}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3"
        />
        <text
          x={cx}
          y={cy + 52}
          fill="#94a3b8"
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {label} ({vRms} V)
        </text>
        <text
          x={cx}
          y={cy + 66}
          fill="#38bdf8"
          fontSize="10"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {instV.toFixed(1)} V
        </text>
      </g>
    );
  }

  function render3PhaseSource(cx: number, cy: number, isStarNeutral = false) {
    return (
      <g>
        {/* Star connected 3-phase source box */}
        <rect
          x={cx - 35}
          y={cy - 85}
          width="70"
          height="170"
          rx="10"
          fill="#090d16"
          stroke="#0284c7"
          strokeWidth="2"
        />
        <text x={cx} y={cy - 65} fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
          3Φ Source
        </text>

        {/* Phase A terminal */}
        <circle cx={cx + 35} cy={cy - 60} r="4" fill="#ef4444" />
        <text x={cx + 10} y={cy - 56} fill="#ef4444" fontSize="11" fontWeight="bold">A</text>

        {/* Phase B terminal */}
        <circle cx={cx + 35} cy={cy} r="4" fill="#eab308" />
        <text x={cx + 10} y={cy + 4} fill="#eab308" fontSize="11" fontWeight="bold">B</text>

        {/* Phase C terminal */}
        <circle cx={cx + 35} cy={cy + 60} r="4" fill="#3b82f6" />
        <text x={cx + 10} y={cy + 64} fill="#3b82f6" fontSize="11" fontWeight="bold">C</text>

        {isStarNeutral && (
          <>
            <circle cx={cx + 35} cy={cy} r="3" fill="#94a3b8" />
            <text x={cx - 20} y={cy + 4} fill="#94a3b8" fontSize="9">N</text>
          </>
        )}
      </g>
    );
  }

  function renderSwitchDevice(
    cx: number,
    cy: number,
    id: string,
    type: SwitchDeviceType,
    isOn: boolean,
    positionTag: string
  ) {
    const isThyristor = type === 'thyristor';
    const activeColor = isOn ? '#10b981' : '#475569';
    const fillColor = isOn ? '#064e3b' : '#0f172a';

    return (
      <g
        className="cursor-pointer group"
        onClick={() => onToggleSwitch(id)}
      >
        {/* Interactive Click Area / Background Card */}
        <rect
          x={cx - 28}
          y={cy - 28}
          width="56"
          height="56"
          rx="8"
          fill={fillColor}
          stroke={isOn ? '#10b981' : '#334155'}
          strokeWidth={isOn ? 2 : 1}
          className="transition-all duration-200 group-hover:stroke-cyan-400 group-hover:fill-slate-800"
        />

        {/* Diode/Thyristor Triangle (Points UPWARDS towards + Rail) */}
        {/* Anode at bottom (cy + 12), Cathode at top (cy - 12) */}
        <polygon
          points={`${cx},${cy - 12} ${cx - 14},${cy + 10} ${cx + 14},${cy + 10}`}
          fill={isOn ? '#10b981' : '#1e293b'}
          stroke={activeColor}
          strokeWidth="2"
        />

        {/* Cathode Line (Top horizontal bar) */}
        <line
          x1={cx - 15}
          y1={cy - 12}
          x2={cx + 15}
          y2={cy - 12}
          stroke={activeColor}
          strokeWidth="2.5"
        />

        {/* Gate Terminal (If Thyristor) */}
        {isThyristor && (
          <path
            d={`M ${cx - 9} ${cy + 4} L ${cx - 22} ${cy + 12}`}
            stroke={isOn ? '#34d399' : '#64748b'}
            strokeWidth="2"
            fill="none"
          />
        )}
        {isThyristor && (
          <circle cx={cx - 22} cy={cy + 12} r="2" fill={isOn ? '#34d399' : '#64748b'} />
        )}

        {/* Label and Badge */}
        <text
          x={cx}
          y={cy - 32}
          fill="#f8fafc"
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {id} ({type === 'thyristor' ? 'SCR' : 'Diode'})
        </text>

        {/* Conduction Status Pill */}
        <rect
          x={cx - 15}
          y={cy + 18}
          width="30"
          height="12"
          rx="3"
          fill={isOn ? '#059669' : '#1e293b'}
        />
        <text
          x={cx}
          y={cy + 27}
          fill={isOn ? '#ffffff' : '#64748b'}
          fontSize="8"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {isOn ? 'ON' : 'OFF'}
        </text>
      </g>
    );
  }

  function renderFreewheelingDiode(
    cx: number,
    topY: number,
    botY: number,
    isConnected: boolean,
    isConducting: boolean
  ) {
    if (!isConnected) return null;
    const midY = (topY + botY) / 2;

    return (
      <g className="cursor-pointer select-none" onClick={onToggleFwd}>
        {/* Vertical Wire */}
        <line
          x1={cx}
          y1={topY}
          x2={cx}
          y2={midY - 26}
          stroke={isConnected ? (isConducting ? '#f59e0b' : '#334155') : '#334155'}
          strokeWidth="2"
          strokeDasharray={isConnected ? 'none' : '4 4'}
          className={isConducting ? 'flow-fwd' : ''}
        />
        <line
          x1={cx}
          y1={midY + 26}
          x2={cx}
          y2={botY}
          stroke={isConnected ? (isConducting ? '#f59e0b' : '#334155') : '#334155'}
          strokeWidth="2"
          strokeDasharray={isConnected ? 'none' : '4 4'}
          className={isConducting ? 'flow-fwd' : ''}
        />

        {/* Diode Container */}
        <rect
          x={cx - 24}
          y={midY - 24}
          width="48"
          height="48"
          rx="8"
          fill={isConducting ? '#451a03' : '#090d16'}
          stroke={isConnected ? (isConducting ? '#f59e0b' : '#475569') : '#334155'}
          strokeWidth={isConducting ? 2 : 1}
          strokeDasharray={isConnected ? 'none' : '3 3'}
        />

        {/* Triangle (Points UPWARDS to clamp positive bus) */}
        <polygon
          points={`${cx},${midY - 10} ${cx - 12},${midY + 10} ${cx + 12},${midY + 10}`}
          fill={isConducting ? '#f59e0b' : isConnected ? '#1e293b' : 'none'}
          stroke={isConnected ? (isConducting ? '#f59e0b' : '#64748b') : '#475569'}
          strokeWidth="2"
        />
        <line
          x1={cx - 13}
          y1={midY - 10}
          x2={cx + 13}
          y2={midY - 10}
          stroke={isConnected ? (isConducting ? '#f59e0b' : '#64748b') : '#475569'}
          strokeWidth="2"
        />

        <text
          x={cx}
          y={midY - 30}
          fill={isConnected ? '#cbd5e1' : '#64748b'}
          fontSize="10"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="monospace"
        >
          D_FW
        </text>
        <text
          x={cx}
          y={midY + 34}
          fill={isConnected ? (isConducting ? '#f59e0b' : '#94a3b8') : '#64748b'}
          fontSize="8"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {isConnected ? (isConducting ? 'CONDUCTING' : 'READY') : 'DISCONNECTED'}
        </text>
      </g>
    );
  }

  function renderLoadBranch(
    cx: number,
    topY: number,
    botY: number,
    type: string,
    res: number,
    ind: number,
    emf: number,
    cur: number
  ) {
    const isConducting = cur > 0.05;
    const midY = (topY + botY) / 2;

    return (
      <g>
        {/* Load outer frame container */}
        <rect
          x={cx - 36}
          y={topY + 30}
          width="72"
          height={botY - topY - 60}
          rx="8"
          fill="#090d16"
          stroke={isConducting ? '#0284c7' : '#334155'}
          strokeWidth="1.5"
        />

        <text
          x={cx}
          y={topY + 20}
          fill="#38bdf8"
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {type} Load
        </text>

        {/* Wire top to load */}
        <line
          x1={cx}
          y1={topY}
          x2={cx}
          y2={topY + 45}
          stroke={isConducting ? '#10b981' : '#334155'}
          strokeWidth="2.5"
          className={isConducting ? 'flow-active' : ''}
        />

        {/* Resistor zig-zag */}
        <path
          d={`M ${cx} ${topY + 45} L ${cx - 8} ${topY + 52} L ${cx + 8} ${topY + 60} L ${cx - 8} ${topY + 68} L ${cx + 8} ${topY + 76} L ${cx} ${topY + 84}`}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
        />
        <text x={cx} y={topY + 97} fill="#cbd5e1" fontSize="9" textAnchor="middle" fontFamily="monospace">
          R = {res} Ω
        </text>

        {/* Inductor coils (if RL or RLE) */}
        {(type === 'RL' || type === 'RLE') && (
          <g>
            <path
              d={`M ${cx} ${topY + 105} 
                  C ${cx + 12} ${topY + 108}, ${cx + 12} ${topY + 118}, ${cx} ${topY + 120}
                  C ${cx + 12} ${topY + 123}, ${cx + 12} ${topY + 133}, ${cx} ${topY + 135}
                  C ${cx + 12} ${topY + 138}, ${cx + 12} ${topY + 148}, ${cx} ${topY + 150}`}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
            />
            <text x={cx} y={topY + 164} fill="#cbd5e1" fontSize="9" textAnchor="middle" fontFamily="monospace">
              L = {ind >= 1000 ? `${(ind / 1000).toFixed(1)} H` : `${ind} mH`}
            </text>
          </g>
        )}

        {/* Back-EMF Battery / DC Motor symbol (if RLE) */}
        {type === 'RLE' && (
          <g>
            <line x1={cx - 14} y1={topY + 175} x2={cx + 14} y2={topY + 175} stroke="#10b981" strokeWidth="2.5" />
            <line x1={cx - 8} y1={topY + 183} x2={cx + 8} y2={topY + 183} stroke="#38bdf8" strokeWidth="1.5" />
            <text x={cx} y={topY + 196} fill="#cbd5e1" fontSize="9" textAnchor="middle" fontFamily="monospace">
              E = {emf} V
            </text>
          </g>
        )}

        {/* Wire bottom out */}
        <line
          x1={cx}
          y1={botY - 40}
          x2={cx}
          y2={botY}
          stroke={isConducting ? '#10b981' : '#334155'}
          strokeWidth="2.5"
          className={isConducting ? 'flow-active' : ''}
        />

        {/* Current Arrow annotation */}
        <g transform={`translate(${cx + 42}, ${midY})`}>
          <path d="M 0 -15 L 0 15 M -4 8 L 0 15 L 4 8" fill="none" stroke="#f59e0b" strokeWidth="2" />
          <text x="8" y="4" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="monospace">
            io
          </text>
        </g>
      </g>
    );
  }
};
