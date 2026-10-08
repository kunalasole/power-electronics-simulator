/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PhaseType = '1phase' | '3phase';
export type TopologyType = 'full-bridge' | 'half-wave';
export type LoadType = 'R' | 'RL' | 'RLE';
export type SwitchDeviceType = 'diode' | 'thyristor';

export interface SwitchState {
  id: string; // e.g. 'T1', 'T2', 'T3', 'T4', 'T5', 'T6'
  label: string;
  type: SwitchDeviceType;
  isOn: boolean;
  isFiring: boolean;
  voltageDrop: number;
}

export interface CircuitParameters {
  phase: PhaseType;
  topology: TopologyType;
  loadType: LoadType;
  firingAngle: number; // in degrees: 0 to 180
  hasFreewheelingDiode: boolean;
  resistance: number; // Ohms (e.g. 20)
  inductance: number; // mH (e.g. 45)
  backEmf: number; // Volts (e.g. 0 to 150)
  sourceRms: number; // Volts (e.g. 230)
  frequency: number; // Hz (50 or 60)
  switches: Record<string, SwitchDeviceType>; // specific override for each switch
}

export interface InstantaneousState {
  angleDeg: number; // instantaneous wt in degrees
  time: number; // instantaneous time in seconds
  sourceVoltages: {
    va: number;
    vb?: number;
    vc?: number;
    vab?: number;
    vbc?: number;
    vca?: number;
  };
  outputVoltage: number;
  outputCurrent: number;
  sourceCurrent: number; // phase A source current
  fwdCurrent: number;
  conductingSwitches: string[];
  activeLoopDescription: string;
  isFreewheeling: boolean;
  gatePulseActive: boolean;
  switchVoltages: Record<string, number>;
}

export interface SimulationSample {
  angleDeg: number;
  time: number;
  vs: number;
  vo: number;
  io: number;
  is: number;
  fwdConduction: boolean;
  conductingDevices: string[];
  vt1: number;
  gatePulse: number; // 0 or 1
}

export interface HarmonicComponent {
  order: number;
  freq: number;
  magnitude: number;
  phase: number;
  percentageOfFundamental: number;
}

export interface SimulationMetrics {
  avgVoltage: number; // V_dc
  rmsVoltage: number; // V_rms
  avgCurrent: number; // I_dc
  rmsCurrent: number; // I_rms
  apparentPower: number; // S in VA
  activePower: number; // P in W
  powerFactor: number; // PF = P / S
  displacementFactor: number; // cos(phi_1)
  distortionFactor: number; // I_1_rms / I_rms
  rippleFactor: number; // RF
  formFactor: number; // FF = V_rms / V_dc
  thdCurrent: number; // Total Harmonic Distortion %
  isContinuousConduction: boolean; // CCM vs DCM
  theoreticalAvgVoltage: number; // Analytical ideal formula
  idealFormulaText: string;
  idealFormulaLatex: string;
}

export interface SimulationResult {
  samples: SimulationSample[];
  metrics: SimulationMetrics;
  harmonicsCurrent: HarmonicComponent[];
  harmonicsVoltage: HarmonicComponent[];
  conductionIntervals: {
    startDeg: number;
    endDeg: number;
    label: string;
    isOff?: boolean;
    isFwd?: boolean;
  }[];
}
