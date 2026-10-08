/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  CircuitParameters,
  SimulationResult,
  InstantaneousState,
  SwitchDeviceType,
} from './types';
import { runSimulation, getInstantaneousState } from './simulation/engine';
import { PRESETS, PresetConfig } from './simulation/theory';

import { TopNav } from './components/TopNav';
import { CircuitSchematic } from './components/CircuitSchematic';
import { Oscilloscope } from './components/Oscilloscope';
import { ControlsBar } from './components/ControlsBar';
import { ParameterDeck } from './components/ParameterDeck';
import { MetricsCards } from './components/MetricsCards';
import { DerivationsBanner } from './components/DerivationsBanner';
import { DerivationsModal } from './components/DerivationsModal';
import { TheoryModal } from './components/TheoryModal';
import { PresetsModal } from './components/PresetsModal';

// Default initial configuration matching the user screenshot:
// Single-phase full-bridge, α = 45°, RL load (R=20Ω, L=45mH), 230V RMS, 50Hz
const DEFAULT_PARAMS: CircuitParameters = {
  phase: '1phase',
  topology: 'full-bridge',
  loadType: 'RL',
  firingAngle: 45,
  hasFreewheelingDiode: false,
  resistance: 20,
  inductance: 45,
  backEmf: 0,
  sourceRms: 230,
  frequency: 50,
  switches: {
    T1: 'thyristor',
    T2: 'thyristor',
    T3: 'thyristor',
    T4: 'thyristor',
  },
};

export default function App() {
  const [params, setParams] = useState<CircuitParameters>(DEFAULT_PARAMS);
  const [angleDeg, setAngleDeg] = useState<number>(252.5);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(0.5);
  const [cycles, setCycles] = useState<1 | 2>(1);

  // Fullscreen states
  const [isSchematicFullscreen, setIsSchematicFullscreen] = useState<boolean>(false);
  const [isScopeFullscreen, setIsScopeFullscreen] = useState<boolean>(false);
  const [isStudioFullscreen, setIsStudioFullscreen] = useState<boolean>(false);

  // Modals
  const [derivationsOpen, setDerivationsOpen] = useState<boolean>(false);
  const [theoryOpen, setTheoryOpen] = useState<boolean>(false);
  const [presetsOpen, setPresetsOpen] = useState<boolean>(false);
  const [activePresetId, setActivePresetId] = useState<string>('1p-rl-controlled-45');

  // Dark/Light Theme
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Memoized simulation result
  const simResult: SimulationResult = useMemo(() => {
    return runSimulation(params);
  }, [params]);

  // Instantaneous state at current electrical angle
  const instState: InstantaneousState = useMemo(() => {
    return getInstantaneousState(simResult, angleDeg, params);
  }, [simResult, angleDeg, params]);

  // Real-time animation loop
  const lastTimeRef = useRef<number>(performance.now());
  const angleRef = useRef<number>(angleDeg);
  angleRef.current = angleDeg;

  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isRunning && deltaSec > 0 && deltaSec < 0.2) {
        // Calibrated pedagogical animation rate:
        // At 1.0x speed: 90 deg/sec (4.0 seconds for a full 360° AC period)
        // At 0.5x speed: 45 deg/sec (8.0 seconds for a full period)
        const baseVisualDegPerSec = 90;
        const degDelta = baseVisualDegPerSec * speed * deltaSec;
        const nextAngle = (angleRef.current + degDelta) % 360;
        setAngleDeg(nextAngle);
      }

      animId = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [isRunning, speed]);

  // Parameter change handler
  const handleParamChange = useCallback((newPartial: Partial<CircuitParameters>) => {
    setParams((prev) => {
      const updated = { ...prev, ...newPartial };

      // Ensure appropriate switches exist when switching between 1-phase and 3-phase
      if (newPartial.phase === '3phase' && prev.phase === '1phase') {
        updated.switches = {
          T1: 'thyristor',
          T2: 'thyristor',
          T3: 'thyristor',
          T4: 'thyristor',
          T5: 'thyristor',
          T6: 'thyristor',
        };
      } else if (newPartial.phase === '1phase' && prev.phase === '3phase') {
        updated.switches = {
          T1: 'thyristor',
          T2: 'thyristor',
          T3: 'thyristor',
          T4: 'thyristor',
        };
      }

      return updated;
    });
  }, []);

  // Quick Device setup button (All Diodes, All Thyristors, Semi-Conv)
  const handleQuickDeviceSetup = useCallback(
    (preset: 'diodes' | 'thyristors' | 'semi') => {
      setParams((prev) => {
        const nextSwitches: Record<string, SwitchDeviceType> = {};
        const is3P = prev.phase === '3phase';
        const switchKeys = is3P
          ? ['T1', 'T2', 'T3', 'T4', 'T5', 'T6']
          : ['T1', 'T2', 'T3', 'T4'];

        if (preset === 'diodes') {
          switchKeys.forEach((k) => (nextSwitches[k] = 'diode'));
          return {
            ...prev,
            firingAngle: 0,
            hasFreewheelingDiode: false,
            switches: nextSwitches,
          };
        } else if (preset === 'thyristors') {
          switchKeys.forEach((k) => (nextSwitches[k] = 'thyristor'));
          return {
            ...prev,
            switches: nextSwitches,
          };
        } else {
          // Semi-converter: Top switches thyristors, bottom diodes
          if (is3P) {
            nextSwitches['T1'] = 'thyristor';
            nextSwitches['T3'] = 'thyristor';
            nextSwitches['T5'] = 'thyristor';
            nextSwitches['T4'] = 'diode';
            nextSwitches['T6'] = 'diode';
            nextSwitches['T2'] = 'diode';
          } else {
            nextSwitches['T1'] = 'thyristor';
            nextSwitches['T3'] = 'thyristor';
            nextSwitches['T2'] = 'diode';
            nextSwitches['T4'] = 'diode';
          }
          return {
            ...prev,
            hasFreewheelingDiode: true,
            switches: nextSwitches,
          };
        }
      });
    },
    []
  );

  // Toggle individual switch between Diode and Thyristor
  const handleToggleSwitch = useCallback((switchId: string) => {
    setParams((prev) => {
      const current = prev.switches[switchId] || 'thyristor';
      const toggled: SwitchDeviceType = current === 'thyristor' ? 'diode' : 'thyristor';
      return {
        ...prev,
        switches: {
          ...prev.switches,
          [switchId]: toggled,
        },
      };
    });
  }, []);

  // Toggle Freewheeling Diode
  const handleToggleFwd = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      hasFreewheelingDiode: !prev.hasFreewheelingDiode,
    }));
  }, []);

  // Step controls
  const handleStep = useCallback((deltaDeg: number) => {
    setIsRunning(false);
    setAngleDeg((prev) => (prev + deltaDeg + 360) % 360);
  }, []);

  // Load preset
  const handleSelectPreset = useCallback((preset: PresetConfig) => {
    setParams(preset.params);
    setActivePresetId(preset.id);
  }, []);

  // Reset to default
  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setAngleDeg(0);
    setIsRunning(true);
    setSpeed(0.5);
    setActivePresetId('1p-rl-controlled-45');
  }, []);

  // Export CSV
  const handleExportCsv = useCallback(() => {
    const headers = 'Angle_deg,Time_s,Vs_V,Vo_V,Io_A,Is_A,Gate_Pulse,Active_Devices\n';
    const rows = simResult.samples
      .map(
        (s) =>
          `${s.angleDeg.toFixed(2)},${s.time.toFixed(5)},${s.vs.toFixed(2)},${s.vo.toFixed(2)},${s.io.toFixed(3)},${s.is.toFixed(3)},${s.gatePulse},"${s.conductingDevices.join('+')}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RectifierLab_${params.phase}_${params.topology}_alpha${params.firingAngle}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [simResult, params]);

  // Fullscreen studio wrapper toggle
  const toggleStudioFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsStudioFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsStudioFullscreen(false);
    }
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'
      }`}
    >
      {/* Top Header Navigation */}
      <TopNav
        onOpenDerivations={() => setDerivationsOpen(true)}
        onOpenPresets={() => setPresetsOpen(true)}
        onOpenTheory={() => setTheoryOpen(true)}
        onReset={handleReset}
        onExportCsv={handleExportCsv}
        isStudioFullscreen={isStudioFullscreen}
        onToggleStudioFullscreen={toggleStudioFullscreen}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Studio Workspace */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto p-3 sm:p-4 md:p-5 flex flex-col gap-4">
        {/* ROW 1: Circuit Schematic (Left) & Oscilloscope (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          {/* Left Column: Circuit Schematic */}
          <div
            className={`${
              isSchematicFullscreen
                ? 'fixed inset-0 z-50 p-4 bg-slate-950'
                : 'lg:col-span-6 flex flex-col min-h-0'
            }`}
          >
            <CircuitSchematic
              params={params}
              state={instState}
              onToggleSwitch={handleToggleSwitch}
              onToggleFwd={handleToggleFwd}
              isFullscreen={isSchematicFullscreen}
              onToggleFullscreen={() => setIsSchematicFullscreen(!isSchematicFullscreen)}
              darkMode={darkMode}
            />
          </div>

          {/* Right Column: Oscilloscope */}
          <div
            className={`${
              isScopeFullscreen
                ? 'fixed inset-0 z-50 p-4 bg-slate-950'
                : 'lg:col-span-6 flex flex-col min-h-0'
            }`}
          >
            <Oscilloscope
              result={simResult}
              state={instState}
              params={params}
              onSeekAngle={(angle) => {
                setIsRunning(false);
                setAngleDeg(angle);
              }}
              isFullscreen={isScopeFullscreen}
              onToggleFullscreen={() => setIsScopeFullscreen(!isScopeFullscreen)}
              cycles={cycles}
              onToggleCycles={() => setCycles(cycles === 1 ? 2 : 1)}
            />
          </div>
        </div>

        {/* ROW 2: Playback Animation Controls Bar */}
        <ControlsBar
          isRunning={isRunning}
          onToggleRun={() => setIsRunning(!isRunning)}
          onStepBack={() => handleStep(-5)}
          onStepForward={() => handleStep(5)}
          onResetAngle={() => {
            setIsRunning(false);
            setAngleDeg(0);
          }}
          speed={speed}
          onChangeSpeed={setSpeed}
        />

        {/* ROW 3: Parameter Configuration Deck */}
        <ParameterDeck
          params={params}
          onChangeParams={handleParamChange}
          onQuickDeviceSetup={handleQuickDeviceSetup}
        />

        {/* ROW 4: Live Engineering Metrics Cards */}
        <MetricsCards metrics={simResult.metrics} />

        {/* ROW 5: Theoretical Derivations & Analytical Formulas Banner */}
        <DerivationsBanner
          params={params}
          metrics={simResult.metrics}
          onOpenDerivations={() => setDerivationsOpen(true)}
        />
      </main>

      {/* MODALS */}
      <DerivationsModal
        isOpen={derivationsOpen}
        onClose={() => setDerivationsOpen(false)}
      />

      <TheoryModal
        isOpen={theoryOpen}
        onClose={() => setTheoryOpen(false)}
      />

      <PresetsModal
        isOpen={presetsOpen}
        onClose={() => setPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
        activePresetId={activePresetId}
      />
    </div>
  );
}
