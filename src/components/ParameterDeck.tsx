/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CircuitParameters,
  PhaseType,
  TopologyType,
  LoadType,
  SwitchDeviceType,
} from '../types';
import { Sliders, Cpu, Zap, Activity } from 'lucide-react';

interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit: string;
  colorClass?: string;
  widthClass?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  colorClass = 'text-slate-100',
  widthClass = 'w-14',
}) => {
  const [localVal, setLocalVal] = useState<string>(value.toString());

  useEffect(() => {
    setLocalVal(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalVal(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      let clamped = parsed;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(localVal);
    if (isNaN(parsed)) {
      setLocalVal(value.toString());
    } else {
      let clamped = parsed;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      setLocalVal(clamped.toString());
      onChange(clamped);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-700/80 focus-within:border-cyan-500 rounded px-1.5 py-0.5 transition-colors shadow-inner">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`${widthClass} bg-transparent font-mono font-bold ${colorClass} text-xs text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />
      <span className="text-[11px] font-mono text-slate-400 select-none shrink-0">{unit}</span>
    </div>
  );
};

interface ParameterDeckProps {
  params: CircuitParameters;
  onChangeParams: (newParams: Partial<CircuitParameters>) => void;
  onQuickDeviceSetup: (preset: 'diodes' | 'thyristors' | 'semi') => void;
}

export const ParameterDeck: React.FC<ParameterDeckProps> = ({
  params,
  onChangeParams,
  onQuickDeviceSetup,
}) => {
  const anglePresets = [0, 30, 45, 60, 90, 120, 150];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. CONVERTER TOPOLOGY CARD */}
      <div className="flex flex-col p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold tracking-wider uppercase text-slate-200">
            Converter Topology
          </h3>
        </div>

        {/* Phase selection: 1-Phase vs 3-Phase */}
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <button
            onClick={() => {
              const newSwitches: Record<string, SwitchDeviceType> =
                params.phase === '3phase'
                  ? { T1: 'thyristor', T2: 'thyristor', T3: 'thyristor', T4: 'thyristor' }
                  : params.switches;
              onChangeParams({ phase: '1phase', switches: newSwitches });
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
              params.phase === '1phase'
                ? 'bg-cyan-600/90 border-cyan-500 text-white shadow-md shadow-cyan-900/20'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
            }`}
          >
            Single-Phase (1Φ)
          </button>

          <button
            onClick={() => {
              const newSwitches: Record<string, SwitchDeviceType> = {
                T1: 'thyristor',
                T2: 'thyristor',
                T3: 'thyristor',
                T4: 'thyristor',
                T5: 'thyristor',
                T6: 'thyristor',
              };
              onChangeParams({ phase: '3phase', switches: newSwitches });
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
              params.phase === '3phase'
                ? 'bg-cyan-600/90 border-cyan-500 text-white shadow-md shadow-cyan-900/20'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
            }`}
          >
            Three-Phase (3Φ)
          </button>
        </div>

        {/* Topology: Full-Bridge vs Half-Wave */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => onChangeParams({ topology: 'full-bridge' })}
            className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
              params.topology === 'full-bridge'
                ? 'bg-cyan-600/90 border-cyan-500 text-white shadow-md shadow-cyan-900/20'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
            }`}
          >
            Full-Bridge
          </button>

          <button
            onClick={() => onChangeParams({ topology: 'half-wave' })}
            className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
              params.topology === 'half-wave'
                ? 'bg-cyan-600/90 border-cyan-500 text-white shadow-md shadow-cyan-900/20'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
            }`}
          >
            Half-Wave
          </button>
        </div>

        {/* Freewheeling Diode (FWD) Selection - Inside Converter Topology */}
        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                params.hasFreewheelingDiode
                  ? 'bg-amber-400 shadow-sm shadow-amber-400'
                  : 'bg-slate-600'
              }`}
            />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-200 block truncate">
                Freewheeling Diode (FWD)
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {params.hasFreewheelingDiode
                  ? 'Connected across DC load'
                  : 'Disconnected (Select when needed)'}
              </span>
            </div>
          </div>

          <button
            onClick={() =>
              onChangeParams({ hasFreewheelingDiode: !params.hasFreewheelingDiode })
            }
            className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all shrink-0 ${
              params.hasFreewheelingDiode
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {params.hasFreewheelingDiode ? 'FWD Active' : '+ Attach FWD'}
          </button>
        </div>

        {/* Quick Device Setup */}
        <div className="mt-auto pt-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium block mb-2">
            Quick Device Setup:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onQuickDeviceSetup('diodes')}
              className="py-1.5 px-2 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              All Diodes
            </button>
            <button
              onClick={() => onQuickDeviceSetup('thyristors')}
              className="py-1.5 px-2 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              All Thyristors
            </button>
            <button
              onClick={() => onQuickDeviceSetup('semi')}
              className="py-1.5 px-2 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              Semi-Conv
            </button>
          </div>
        </div>
      </div>

      {/* 2. FIRING ANGLE α CARD */}
      <div className="flex flex-col p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-200">
              Firing Angle (α)
            </h3>
          </div>
          {/* Keyboard typeable input for firing angle α */}
          <NumericInput
            value={params.firingAngle}
            onChange={(val) => onChangeParams({ firingAngle: val })}
            min={0}
            max={180}
            step={1}
            unit="°"
            colorClass="text-amber-400"
            widthClass="w-12"
          />
        </div>

        {/* Firing Angle Slider */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max="180"
            step="1"
            value={params.firingAngle}
            onChange={(e) => onChangeParams({ firingAngle: parseInt(e.target.value) || 0 })}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Quick Angle Chips */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {anglePresets.map((deg) => (
            <button
              key={deg}
              onClick={() => onChangeParams({ firingAngle: deg })}
              className={`py-1 text-[11px] font-mono rounded transition-colors ${
                params.firingAngle === deg
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>

        {/* Mode Status Info Badge */}
        <div className="mt-auto pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Control Mode:</span>
          <span className="font-mono text-[11px] text-cyan-400 font-semibold">
            {params.firingAngle === 0 ? 'Natural (α = 0°)' : `Delayed Trigger (α = ${params.firingAngle}°)`}
          </span>
        </div>
      </div>

      {/* 3. LOAD & SOURCE PARAMETERS CARD */}
      <div className="flex flex-col p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold tracking-wider uppercase text-slate-200">
            Load & Source Parameters
          </h3>
        </div>

        {/* Load Type Segmented Buttons */}
        <div className="grid grid-cols-4 gap-1 mb-3">
          <button
            onClick={() => onChangeParams({ loadType: 'R', inductance: 0, backEmf: 0 })}
            className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg border transition-all text-center ${
              params.loadType === 'R' && params.backEmf === 0
                ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-md'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            R Load
          </button>

          <button
            onClick={() => onChangeParams({ loadType: 'RL', inductance: params.inductance || 45, backEmf: 0 })}
            className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg border transition-all text-center ${
              params.loadType === 'RL'
                ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-md'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            RL Load
          </button>

          <button
            onClick={() => onChangeParams({ loadType: 'RLE', inductance: 0, backEmf: params.backEmf !== 0 ? params.backEmf : 100 })}
            className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg border transition-all text-center ${
              params.loadType === 'RLE' && params.inductance <= 0.5
                ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-md'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
            title="Resistance with Back-EMF (Battery charging)"
          >
            R + E
          </button>

          <button
            onClick={() => onChangeParams({ loadType: 'RLE', inductance: params.inductance || 45, backEmf: params.backEmf !== 0 ? params.backEmf : 100 })}
            className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg border transition-all text-center ${
              params.loadType === 'RLE' && params.inductance > 0.5
                ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-md'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
            title="Inductive with Back-EMF (Motor load)"
          >
            RL + E
          </button>
        </div>

        {/* R (Resistance) - Slider & Keyboard Input */}
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400">R (Resistance):</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="200"
              value={params.resistance}
              onChange={(e) => onChangeParams({ resistance: parseFloat(e.target.value) || 1 })}
              className="w-20 sm:w-24 accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <NumericInput
              value={params.resistance}
              onChange={(val) => onChangeParams({ resistance: val })}
              min={0.1}
              max={1000}
              step={1}
              unit="Ω"
              colorClass="text-emerald-400"
              widthClass="w-12"
            />
          </div>
        </div>

        {/* L (Inductance) - Slider & Keyboard Input (Supports up to 10 H = 10,000 mH) */}
        {(params.loadType === 'RL' || (params.loadType === 'RLE' && params.inductance > 0.5)) && (
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">
              L (Inductance){params.inductance >= 1000 ? ` (${(params.inductance / 1000).toFixed(1)}H)` : ''}:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="10000"
                step="10"
                value={params.inductance}
                onChange={(e) => onChangeParams({ inductance: parseFloat(e.target.value) || 0 })}
                className="w-20 sm:w-24 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <NumericInput
                value={params.inductance}
                onChange={(val) => onChangeParams({ inductance: val })}
                min={0}
                max={10000}
                step={5}
                unit="mH"
                colorClass="text-amber-400"
                widthClass="w-16"
              />
            </div>
          </div>
        )}

        {/* Back-EMF (E) - Slider & Keyboard Input (Supports up to 300V) */}
        {(params.loadType === 'RLE' || params.backEmf !== 0) && (
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">Back-EMF (E):</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-300"
                max="300"
                step="1"
                value={params.backEmf}
                onChange={(e) => onChangeParams({ backEmf: parseFloat(e.target.value) || 0 })}
                className="w-20 sm:w-24 accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <NumericInput
                value={params.backEmf}
                onChange={(val) => onChangeParams({ backEmf: val })}
                min={-300}
                max={300}
                step={1}
                unit="V"
                colorClass="text-purple-400"
                widthClass="w-14"
              />
            </div>
          </div>
        )}

        {/* Source RMS - Slider & Keyboard Input */}
        <div className="flex items-center justify-between text-xs mt-auto pt-2 border-t border-slate-800/80">
          <span className="text-slate-400">Source RMS:</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="20"
              max="480"
              step="5"
              value={params.sourceRms}
              onChange={(e) => onChangeParams({ sourceRms: parseFloat(e.target.value) || 20 })}
              className="w-20 sm:w-24 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <NumericInput
              value={params.sourceRms}
              onChange={(val) => onChangeParams({ sourceRms: val })}
              min={1}
              max={1000}
              step={1}
              unit="V"
              colorClass="text-cyan-400"
              widthClass="w-12"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
