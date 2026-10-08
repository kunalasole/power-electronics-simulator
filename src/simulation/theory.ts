/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CircuitParameters } from '../types';

export interface PresetConfig {
  id: string;
  title: string;
  category: string;
  description: string;
  params: CircuitParameters;
}

export const PRESETS: PresetConfig[] = [
  {
    id: '1p-rl-controlled-45',
    title: '1Φ Fully-Controlled Bridge (α = 45°, RL Load)',
    category: 'Single-Phase Controlled',
    description: 'Classic 2-quadrant bridge converter with inductive smoothing without freewheeling diode. Shows negative output voltage excursions.',
    params: {
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
    },
  },
  {
    id: '1p-semi-converter',
    title: '1Φ Semi-Converter / Half-Controlled (with FWD)',
    category: 'Single-Phase Controlled',
    description: 'Half-controlled bridge with freewheeling action. Prevents negative voltage spikes, boosting average DC voltage and power factor.',
    params: {
      phase: '1phase',
      topology: 'full-bridge',
      loadType: 'RL',
      firingAngle: 45,
      hasFreewheelingDiode: true,
      resistance: 20,
      inductance: 45,
      backEmf: 0,
      sourceRms: 230,
      frequency: 50,
      switches: {
        T1: 'thyristor',
        T2: 'diode',
        T3: 'thyristor',
        T4: 'diode',
      },
    },
  },
  {
    id: '1p-diode-bridge',
    title: '1Φ Diode Bridge Rectifier (Uncontrolled)',
    category: 'Single-Phase Uncontrolled',
    description: 'Standard 4-diode Graetz full-wave bridge rectifier. Instantaneous natural commutation at zero voltage crossings.',
    params: {
      phase: '1phase',
      topology: 'full-bridge',
      loadType: 'RL',
      firingAngle: 0,
      hasFreewheelingDiode: false,
      resistance: 20,
      inductance: 25,
      backEmf: 0,
      sourceRms: 230,
      frequency: 50,
      switches: {
        T1: 'diode',
        T2: 'diode',
        T3: 'diode',
        T4: 'diode',
      },
    },
  },
  {
    id: '1p-rle-motor-inverter',
    title: '1Φ Inverting Mode / DC Motor Regeneration (α = 120°)',
    category: 'Single-Phase Inverter',
    description: 'Operating in 4th quadrant (α > 90°) with active DC Back-EMF. Power flows from DC motor back into the AC supply grid.',
    params: {
      phase: '1phase',
      topology: 'full-bridge',
      loadType: 'RLE',
      firingAngle: 120,
      hasFreewheelingDiode: false,
      resistance: 10,
      inductance: 75,
      backEmf: -120,
      sourceRms: 230,
      frequency: 50,
      switches: {
        T1: 'thyristor',
        T2: 'thyristor',
        T3: 'thyristor',
        T4: 'thyristor',
      },
    },
  },
  {
    id: '1p-half-wave-battery-emf',
    title: '1Φ Half-Wave Rectifier with R & Back-EMF (Battery Charging)',
    category: 'Single-Phase Half-Wave',
    description: 'Textbook benchmark for diode rectifier charging a battery (R + EMF). Current conducts only when source voltage exceeds Back-EMF (vs > E).',
    params: {
      phase: '1phase',
      topology: 'half-wave',
      loadType: 'RLE',
      firingAngle: 0,
      hasFreewheelingDiode: false,
      resistance: 10,
      inductance: 0,
      backEmf: 100,
      sourceRms: 230,
      frequency: 50,
      switches: {
        T1: 'diode',
      },
    },
  },
  {
    id: '1p-half-wave-fwd',
    title: '1Φ Half-Wave Rectifier with RL Load & FWD',
    category: 'Single-Phase Half-Wave',
    description: 'Single thyristor half-wave converter. Demonstrates current decay through the freewheeling diode during the negative half-cycle.',
    params: {
      phase: '1phase',
      topology: 'half-wave',
      loadType: 'RL',
      firingAngle: 30,
      hasFreewheelingDiode: true,
      resistance: 25,
      inductance: 50,
      backEmf: 0,
      sourceRms: 230,
      frequency: 50,
      switches: {
        T1: 'thyristor',
      },
    },
  },
  {
    id: '3p-6pulse-diode',
    title: '3Φ 6-Pulse Diode Bridge Rectifier',
    category: 'Three-Phase Uncontrolled',
    description: 'Heavy industrial 6-diode rectifier operating from 400V line-to-line 3-phase supply. Very low 6th harmonic ripple in output voltage.',
    params: {
      phase: '3phase',
      topology: 'full-bridge',
      loadType: 'RL',
      firingAngle: 0,
      hasFreewheelingDiode: false,
      resistance: 15,
      inductance: 35,
      backEmf: 0,
      sourceRms: 230, // 400V line-to-line = 230V phase
      frequency: 50,
      switches: {
        T1: 'diode',
        T2: 'diode',
        T3: 'diode',
        T4: 'diode',
        T5: 'diode',
        T6: 'diode',
      },
    },
  },
  {
    id: '3p-6pulse-thyristor',
    title: '3Φ Fully-Controlled 6-Pulse Converter (α = 45°)',
    category: 'Three-Phase Controlled',
    description: 'High-power 6-thyristor dual converter. Conduction handoff every 60° across phase pairs with adjustable firing delay.',
    params: {
      phase: '3phase',
      topology: 'full-bridge',
      loadType: 'RL',
      firingAngle: 45,
      hasFreewheelingDiode: false,
      resistance: 15,
      inductance: 50,
      backEmf: 0,
      sourceRms: 230,
      frequency: 50,
      switches: {
        T1: 'thyristor',
        T2: 'thyristor',
        T3: 'thyristor',
        T4: 'thyristor',
        T5: 'thyristor',
        T6: 'thyristor',
      },
    },
  },
  {
    id: '3p-3pulse-halfwave',
    title: '3Φ 3-Pulse Half-Wave (Midpoint) Converter',
    category: 'Three-Phase Half-Wave',
    description: 'Three thyristors connected to phases A, B, C with common cathode return to neutral line. Pulse number p = 3.',
    params: {
      phase: '3phase',
      topology: 'half-wave',
      loadType: 'RL',
      firingAngle: 30,
      hasFreewheelingDiode: false,
      resistance: 20,
      inductance: 40,
      backEmf: 0,
      sourceRms: 230,
      frequency: 50,
      switches: {
        T1: 'thyristor',
        T3: 'thyristor',
        T5: 'thyristor',
      },
    },
  },
];

export interface DerivationTopic {
  title: string;
  topology: string;
  summary: string;
  integralStep: string;
  resultFormula: string;
  rmsFormula: string;
  notes: string[];
}

export const DERIVATIONS_LIBRARY: DerivationTopic[] = [
  {
    title: '1-Phase Fully Controlled Full-Wave Bridge Converter (RL Load, Continuous)',
    topology: '1-Phase Full-Bridge',
    summary: 'Thyristor pairs (T1, T2) and (T3, T4) are fired alternately at α and π + α. Because of large load inductance, current never drops to zero.',
    integralStep: 'V_{dc} = \\frac{1}{\\pi} \\int_{\\alpha}^{\\pi + \\alpha} V_m \\sin(\\omega t) \\, d(\\omega t) = \\frac{V_m}{\\pi} [-\\cos(\\omega t)]_{\\alpha}^{\\pi + \\alpha}',
    resultFormula: 'V_{dc} = \\frac{2 V_m}{\\pi} \\cos\\alpha',
    rmsFormula: 'V_{rms} = \\sqrt{\\frac{1}{\\pi} \\int_{\\alpha}^{\\pi + \\alpha} V_m^2 \\sin^2(\\omega t) \\, d(\\omega t)} = \\frac{V_m}{\\sqrt{2}} = V_{source,rms}',
    notes: [
      'For α = 0°, V_dc = 2Vm/π ≈ 0.6366 Vm (same as uncontrolled diode bridge).',
      'For α = 90°, V_dc = 0 V (average voltage is zero; circuit acts as static VAR compensator).',
      'For α > 90°, V_dc < 0. If a DC voltage source (Back-EMF E) is present in the load, the converter operates as a line-commutated inverter, feeding energy back to the AC grid.',
      'Two-quadrant operation: Voltage can be positive or negative, but load current is always positive (unidirectional).',
    ],
  },
  {
    title: '1-Phase Semi-Converter (Half-Controlled Bridge or with Freewheeling Diode)',
    topology: '1-Phase Semi-Converter',
    summary: 'Consists of two thyristors and two diodes, or a fully controlled bridge equipped with a freewheeling diode (FWD). Negative voltage excursions are blocked.',
    integralStep: 'V_{dc} = \\frac{1}{\\pi} \\int_{\\alpha}^{\\pi} V_m \\sin(\\omega t) \\, d(\\omega t) + \\frac{1}{\\pi} \\int_{\\pi}^{\\pi + \\alpha} 0 \\, d(\\omega t)',
    resultFormula: 'V_{dc} = \\frac{V_m}{\\pi} (1 + \\cos\\alpha)',
    rmsFormula: 'V_{rms} = \\frac{V_m}{\\sqrt{2}} \\sqrt{1 - \\frac{\\alpha}{\\pi} + \\frac{\\sin(2\\alpha)}{2\\pi}}',
    notes: [
      'At ωt = π, the AC source voltage reverses. The freewheeling diode (or the diode pair) naturally forward biases, clamping the load voltage to 0 V.',
      'Prevents the average voltage from going negative; only operates in the 1st quadrant (rectifier only).',
      'Input power factor is significantly higher than a fully controlled converter at delayed firing angles.',
      'The load current continues to circulate through the FWD, preventing inductive kickback and reducing current ripple.',
    ],
  },
  {
    title: '1-Phase Half-Wave Controlled Rectifier (R & RL Load)',
    topology: '1-Phase Half-Wave',
    summary: 'Single thyristor in series with source and load. Conducts only during positive half cycles after trigger angle α.',
    integralStep: 'V_{dc} = \\frac{1}{2\\pi} \\int_{\\alpha}^{\\pi} V_m \\sin(\\omega t) \\, d(\\omega t) = \\frac{V_m}{2\\pi} [-\\cos(\\omega t)]_{\\alpha}^{\\pi}',
    resultFormula: 'V_{dc} = \\frac{V_m}{2\\pi} (1 + \\cos\\alpha)',
    rmsFormula: 'V_{rms} = \\frac{V_m}{2} \\sqrt{1 - \\frac{\\alpha}{\\pi} + \\frac{\\sin(2\\alpha)}{2\\pi}}',
    notes: [
      'Maximum average voltage occurs at α = 0°: V_dc = Vm / π ≈ 0.318 Vm.',
      'High ripple factor and substantial DC saturation current in any supply transformer.',
      'Without FWD and with inductive load, current continues past π to extinction angle β, causing negative voltage and reducing V_dc.',
    ],
  },
  {
    title: '3-Phase Fully Controlled 6-Pulse Bridge Converter',
    topology: '3-Phase Full-Bridge',
    summary: 'Six thyristors connected in bridge formation. Commutation occurs every 60° (π/3 radians). Natural commutation origin is at ωt = 30°.',
    integralStep: 'V_{dc} = \\frac{3}{\\pi} \\int_{-\\frac{\\pi}{6} + \\alpha}^{\\frac{\\pi}{6} + \\alpha} \\sqrt{3} V_m \\cos(\\omega t) \\, d(\\omega t)',
    resultFormula: 'V_{dc} = \\frac{3\\sqrt{3} V_m}{\\pi} \\cos\\alpha = \\frac{3 V_{ml}}{\\pi} \\cos\\alpha',
    rmsFormula: 'V_{rms} = \\sqrt{3} V_m \\sqrt{\\frac{1}{2} + \\frac{3\\sqrt{3}}{4\\pi} \\cos(2\\alpha)}',
    notes: [
      'V_ml is the peak line-to-line voltage: V_ml = √3 · Vm.',
      'For α = 0° (uncontrolled 6-diode bridge): V_dc = (3√3 / π) Vm ≈ 1.654 Vm = 0.955 V_ml.',
      'Lowest harmonic order in output voltage is 6th harmonic (300 Hz for 50 Hz system, 360 Hz for 60 Hz).',
      'For continuous conduction, α can range from 0° to 180°. At α > 90°, it functions as a 3-phase line-commutated inverter.',
    ],
  },
  {
    title: '3-Phase Half-Wave (3-Pulse Midpoint) Converter',
    topology: '3-Phase Half-Wave',
    summary: 'Three thyristors connected to phases A, B, and C with the return path through the neutral line.',
    integralStep: 'V_{dc} = \\frac{3}{2\\pi} \\int_{-\\frac{\\pi}{3} + \\alpha}^{\\frac{\\pi}{3} + \\alpha} V_m \\cos(\\omega t) \\, d(\\omega t)',
    resultFormula: 'V_{dc} = \\frac{3\\sqrt{3} V_m}{2\\pi} \\cos\\alpha',
    rmsFormula: 'V_{rms} = V_m \\sqrt{\\frac{1}{2} + \\frac{3\\sqrt{3}}{8\\pi} \\cos(2\\alpha)}',
    notes: [
      'Each thyristor conducts for 120° (2π/3 radians).',
      'Output voltage ripple frequency is 3 times the supply frequency (150 Hz for 50 Hz).',
      'Causes DC component in transformer neutral line, leading to core saturation unless special zig-zag transformers are employed.',
    ],
  },
];
