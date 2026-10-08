/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CircuitParameters,
  SimulationSample,
  SimulationResult,
  SimulationMetrics,
  HarmonicComponent,
  InstantaneousState,
} from '../types';

/**
 * High-precision numerical simulation engine for single-phase and three-phase
 * power electronics rectifiers and converters with full support for R, RL, and RLE
 * (Back-EMF battery / DC motor) loads.
 */

const SAMPLES_PER_CYCLE = 720; // 0.5 degree resolution

export function runSimulation(params: CircuitParameters): SimulationResult {
  const {
    phase,
    topology,
    loadType,
    firingAngle,
    hasFreewheelingDiode,
    resistance,
    inductance, // in mH
    backEmf,
    sourceRms,
    frequency,
    switches,
  } = params;

  const R = Math.max(0.1, resistance);
  const isPureR = loadType === 'R' || (loadType === 'RLE' && inductance <= 0.5);
  const L = isPureR ? 0 : Math.max(0.0005, inductance * 1e-3);
  const E = loadType === 'RLE' ? backEmf : 0;
  const Vm = Math.sqrt(2) * sourceRms;
  const omega = 2 * Math.PI * frequency;
  const T = 1 / frequency;
  const dt = T / SAMPLES_PER_CYCLE;
  const alphaRad = (firingAngle * Math.PI) / 180;

  // Detect converter mode based on switch overrides
  const is1P = phase === '1phase';
  const isFull = topology === 'full-bridge';

  // Check active switches for this specific topology
  const isControlled = is1P
    ? isFull
      ? (switches['T1'] === 'thyristor' ||
          switches['T2'] === 'thyristor' ||
          switches['T3'] === 'thyristor' ||
          switches['T4'] === 'thyristor')
      : switches['T1'] === 'thyristor'
    : isFull
    ? (switches['T1'] === 'thyristor' ||
        switches['T2'] === 'thyristor' ||
        switches['T3'] === 'thyristor' ||
        switches['T4'] === 'thyristor' ||
        switches['T5'] === 'thyristor' ||
        switches['T6'] === 'thyristor')
    : switches['T1'] === 'thyristor' ||
      switches['T3'] === 'thyristor' ||
      switches['T5'] === 'thyristor';

  const effectiveAlphaRad = isControlled ? alphaRad : 0;
  const effectiveAlphaDeg = (effectiveAlphaRad * 180) / Math.PI;

  // Storage for final cycle
  const rawVo: number[] = new Array(SAMPLES_PER_CYCLE);
  const rawIo: number[] = new Array(SAMPLES_PER_CYCLE);
  const rawIs: number[] = new Array(SAMPLES_PER_CYCLE);
  const rawVs: number[] = new Array(SAMPLES_PER_CYCLE);
  const rawVt1: number[] = new Array(SAMPLES_PER_CYCLE);
  const rawFwd: boolean[] = new Array(SAMPLES_PER_CYCLE);
  const rawPairs: string[][] = new Array(SAMPLES_PER_CYCLE);
  const rawGatePulses: number[] = new Array(SAMPLES_PER_CYCLE);

  // Time-stepping loop across 3 cycles for steady-state convergence
  const totalSteps = SAMPLES_PER_CYCLE * 3;
  let currentIo = 0; // initial load current
  let isCurrentlyConducting = false;
  let activeBranch = '';

  for (let step = 0; step < totalSteps; step++) {
    const cycleStep = step % SAMPLES_PER_CYCLE;
    const angleDeg = (cycleStep / SAMPLES_PER_CYCLE) * 360;
    const angleRad = (angleDeg * Math.PI) / 180;
    const time = step * dt;

    // Source voltages
    const va = Vm * Math.sin(angleRad);
    const vb = Vm * Math.sin(angleRad - (2 * Math.PI) / 3);
    const vc = Vm * Math.sin(angleRad + (2 * Math.PI) / 3);

    // Line-to-line voltages
    const vab = va - vb;
    const vac = va - vc;
    const vbc = vb - vc;
    const vba = -vab;
    const vca = vc - va;
    const vcb = -vbc;

    let v_rect = E;
    let conducting: string[] = [];
    let isFwdActive = false;
    let isCurrentPhaseA = 0;
    let gatePulse = 0;

    // ------------------------------------------------------------------------
    // TOPOLOGY 1: SINGLE-PHASE FULL-BRIDGE
    // ------------------------------------------------------------------------
    if (is1P && isFull) {
      const pulseWidthDeg = 8;
      const dist1 = (angleDeg - effectiveAlphaDeg + 360) % 360;
      const dist2 = (angleDeg - (180 + effectiveAlphaDeg) + 360) % 360;
      if (dist1 <= pulseWidthDeg || dist2 <= pulseWidthDeg) {
        gatePulse = 1;
      }

      if (isPureR) {
        // Pure R or RLE with L = 0 (exact algebraic solution)
        const canConductPos =
          angleDeg >= effectiveAlphaDeg && angleDeg < 180 && va > E;
        const canConductNeg =
          angleDeg >= 180 + effectiveAlphaDeg && angleDeg < 360 && -va > E;

        if (canConductPos) {
          v_rect = va;
          currentIo = (va - E) / R;
          conducting = ['T1', 'T2'];
          isCurrentPhaseA = 1;
        } else if (canConductNeg) {
          v_rect = -va;
          currentIo = (-va - E) / R;
          conducting = ['T3', 'T4'];
          isCurrentPhaseA = -1;
        } else {
          v_rect = E;
          currentIo = 0;
          conducting = [];
          isCurrentPhaseA = 0;
        }
      } else {
        // Inductive RL or RLE (L > 0)
        const triggerPos =
          angleDeg >= effectiveAlphaDeg && angleDeg < 180 && (va > E || currentIo > 0.01);
        const triggerNeg =
          angleDeg >= 180 + effectiveAlphaDeg && angleDeg < 360 && (-va > E || currentIo > 0.01);

        if (triggerPos) {
          activeBranch = 'pos';
          isCurrentlyConducting = true;
        } else if (triggerNeg) {
          activeBranch = 'neg';
          isCurrentlyConducting = true;
        }

        if (isCurrentlyConducting && activeBranch === 'pos') {
          let v_applied = va;
          if (hasFreewheelingDiode && v_applied < 0) {
            v_applied = 0;
            isFwdActive = true;
            conducting = ['D_FW'];
            isCurrentPhaseA = 0;
          } else {
            conducting = ['T1', 'T2'];
            isCurrentPhaseA = 1;
          }

          // Backward Euler integration
          const subSteps = 4;
          const subDt = dt / subSteps;
          for (let s = 0; s < subSteps; s++) {
            currentIo = (currentIo + (subDt / L) * (v_applied - E)) / (1 + (R * subDt) / L);
            if (currentIo < 0) currentIo = 0;
          }

          if (currentIo <= 0.001 && va <= E) {
            currentIo = 0;
            isCurrentlyConducting = false;
            v_rect = E;
            conducting = [];
            isCurrentPhaseA = 0;
          } else {
            v_rect = v_applied;
          }
        } else if (isCurrentlyConducting && activeBranch === 'neg') {
          let v_applied = -va;
          if (hasFreewheelingDiode && v_applied < 0) {
            v_applied = 0;
            isFwdActive = true;
            conducting = ['D_FW'];
            isCurrentPhaseA = 0;
          } else {
            conducting = ['T3', 'T4'];
            isCurrentPhaseA = -1;
          }

          const subSteps = 4;
          const subDt = dt / subSteps;
          for (let s = 0; s < subSteps; s++) {
            currentIo = (currentIo + (subDt / L) * (v_applied - E)) / (1 + (R * subDt) / L);
            if (currentIo < 0) currentIo = 0;
          }

          if (currentIo <= 0.001 && -va <= E) {
            currentIo = 0;
            isCurrentlyConducting = false;
            v_rect = E;
            conducting = [];
            isCurrentPhaseA = 0;
          } else {
            v_rect = v_applied;
          }
        } else {
          currentIo = 0;
          v_rect = E;
          conducting = [];
          isCurrentPhaseA = 0;
        }
      }
    }

    // ------------------------------------------------------------------------
    // TOPOLOGY 2: SINGLE-PHASE HALF-WAVE (Matches textbook & user reference image)
    // ------------------------------------------------------------------------
    else if (is1P && !isFull) {
      const isT1Diode = switches['T1'] === 'diode';
      const theta1Deg =
        E > 0 && E < Vm ? (Math.asin(E / Vm) * 180) / Math.PI : 0;
      const theta2Deg = E > 0 && E < Vm ? 180 - theta1Deg : 180;
      const turnOnDeg = isT1Diode ? theta1Deg : Math.max(effectiveAlphaDeg, theta1Deg);

      const pulseWidthDeg = 8;
      const dist = (angleDeg - effectiveAlphaDeg + 360) % 360;
      if (!isT1Diode && dist <= pulseWidthDeg) gatePulse = 1;

      if (isPureR) {
        // Pure R or R + E (L = 0)
        // If E >= Vm, the AC source never exceeds back-EMF, so no current can flow
        const canConduct =
          E < Vm &&
          turnOnDeg <= theta2Deg &&
          angleDeg >= turnOnDeg &&
          angleDeg <= theta2Deg &&
          va >= E;

        if (canConduct) {
          v_rect = va;
          currentIo = (va - E) / R;
          conducting = ['T1'];
          isCurrentPhaseA = 1;
        } else {
          v_rect = E;
          currentIo = 0;
          conducting = [];
          isCurrentPhaseA = 0;
        }
      } else {
        // Inductive Half-Wave (RL or RL + E with L > 0)
        const canTrigger =
          E < Vm &&
          turnOnDeg <= theta2Deg &&
          angleDeg >= turnOnDeg &&
          angleDeg < turnOnDeg + 12 &&
          va >= E;

        if (canTrigger) {
          isCurrentlyConducting = true;
        }

        if (isCurrentlyConducting) {
          let v_applied = va;

          // Freewheeling diode action
          if (hasFreewheelingDiode && v_applied < 0) {
            v_applied = 0;
            isFwdActive = true;
            conducting = ['D_FW'];
            isCurrentPhaseA = 0;
          } else {
            conducting = ['T1'];
            isCurrentPhaseA = 1;
          }

          // Unconditionally stable Backward Euler integration
          const subSteps = 6;
          const subDt = dt / subSteps;
          for (let s = 0; s < subSteps; s++) {
            currentIo = (currentIo + (subDt / L) * (v_applied - E)) / (1 + (R * subDt) / L);
            if (currentIo < 0) currentIo = 0;
          }

          if (currentIo <= 0.0008 && angleDeg > theta2Deg) {
            currentIo = 0;
            isCurrentlyConducting = false;
            v_rect = E;
            conducting = [];
            isCurrentPhaseA = 0;
          } else {
            v_rect = v_applied;
          }
        } else {
          currentIo = 0;
          v_rect = E;
          conducting = [];
          isCurrentPhaseA = 0;
        }
      }
    }

    // ------------------------------------------------------------------------
    // TOPOLOGY 3: THREE-PHASE FULL-BRIDGE (6-Pulse)
    // ------------------------------------------------------------------------
    else if (!is1P && isFull) {
      const offset = (angleDeg - 30 - effectiveAlphaDeg + 720) % 360;
      const intervalIdx = Math.floor(offset / 60);

      const distPulse = offset % 60;
      if (distPulse <= 6) gatePulse = 1;

      let v_line = 0;
      let branchPair: string[] = [];
      let phaseASign = 0;

      switch (intervalIdx) {
        case 0:
          v_line = vab;
          branchPair = ['T1', 'T6'];
          phaseASign = 1;
          break;
        case 1:
          v_line = vac;
          branchPair = ['T1', 'T2'];
          phaseASign = 1;
          break;
        case 2:
          v_line = vbc;
          branchPair = ['T3', 'T2'];
          phaseASign = 0;
          break;
        case 3:
          v_line = vba;
          branchPair = ['T3', 'T4'];
          phaseASign = -1;
          break;
        case 4:
          v_line = vca;
          branchPair = ['T5', 'T4'];
          phaseASign = -1;
          break;
        case 5:
          v_line = vcb;
          branchPair = ['T5', 'T6'];
          phaseASign = 0;
          break;
      }

      if (isPureR) {
        if (v_line > E) {
          v_rect = v_line;
          currentIo = (v_line - E) / R;
          conducting = branchPair;
          isCurrentPhaseA = phaseASign;
        } else {
          v_rect = E;
          currentIo = 0;
          conducting = [];
          isCurrentPhaseA = 0;
        }
      } else {
        if (v_line > E || currentIo > 0.01) {
          let v_applied = v_line;
          if (hasFreewheelingDiode && v_applied < 0) {
            v_applied = 0;
            isFwdActive = true;
            conducting = ['D_FW'];
            isCurrentPhaseA = 0;
          } else {
            conducting = branchPair;
            isCurrentPhaseA = phaseASign;
          }

          const subSteps = 4;
          const subDt = dt / subSteps;
          for (let s = 0; s < subSteps; s++) {
            currentIo = (currentIo + (subDt / L) * (v_applied - E)) / (1 + (R * subDt) / L);
            if (currentIo < 0) currentIo = 0;
          }

          if (currentIo <= 0.001) {
            currentIo = 0;
            v_rect = E;
            conducting = [];
            isCurrentPhaseA = 0;
          } else {
            v_rect = v_applied;
          }
        } else {
          currentIo = 0;
          v_rect = E;
          conducting = [];
          isCurrentPhaseA = 0;
        }
      }
    }

    // ------------------------------------------------------------------------
    // TOPOLOGY 4: THREE-PHASE HALF-WAVE (3-Pulse Midpoint)
    // ------------------------------------------------------------------------
    else {
      const offset = (angleDeg - 30 - effectiveAlphaDeg + 720) % 360;
      const intervalIdx = Math.floor(offset / 120);

      const distPulse = offset % 120;
      if (distPulse <= 6) gatePulse = 1;

      let v_phase = 0;
      let branchSwitch = '';
      let phaseASign = 0;

      switch (intervalIdx) {
        case 0:
          v_phase = va;
          branchSwitch = 'T1';
          phaseASign = 1;
          break;
        case 1:
          v_phase = vb;
          branchSwitch = 'T3';
          phaseASign = 0;
          break;
        case 2:
          v_phase = vc;
          branchSwitch = 'T5';
          phaseASign = 0;
          break;
      }

      if (isPureR) {
        if (v_phase > E) {
          v_rect = v_phase;
          currentIo = (v_phase - E) / R;
          conducting = [branchSwitch];
          isCurrentPhaseA = phaseASign;
        } else {
          v_rect = E;
          currentIo = 0;
          conducting = [];
          isCurrentPhaseA = 0;
        }
      } else {
        if (v_phase > E || currentIo > 0.01) {
          let v_applied = v_phase;
          if (hasFreewheelingDiode && v_applied < 0) {
            v_applied = 0;
            isFwdActive = true;
            conducting = ['D_FW'];
            isCurrentPhaseA = 0;
          } else {
            conducting = [branchSwitch];
            isCurrentPhaseA = phaseASign;
          }

          const subSteps = 4;
          const subDt = dt / subSteps;
          for (let s = 0; s < subSteps; s++) {
            currentIo = (currentIo + (subDt / L) * (v_applied - E)) / (1 + (R * subDt) / L);
            if (currentIo < 0) currentIo = 0;
          }

          if (currentIo <= 0.001) {
            currentIo = 0;
            v_rect = E;
            conducting = [];
            isCurrentPhaseA = 0;
          } else {
            v_rect = v_applied;
          }
        } else {
          currentIo = 0;
          v_rect = E;
          conducting = [];
          isCurrentPhaseA = 0;
        }
      }
    }

    // Phase A source current
    const actualIs = isCurrentPhaseA * currentIo;

    // Voltage across switch T1:
    let vt1 = 0;
    if (conducting.includes('T1')) {
      vt1 = 0;
    } else {
      vt1 = va - v_rect;
    }

    // Record data for the final cycle
    if (step >= totalSteps - SAMPLES_PER_CYCLE) {
      rawVo[cycleStep] = v_rect;
      rawIo[cycleStep] = currentIo;
      rawIs[cycleStep] = actualIs;
      rawVs[cycleStep] = va;
      rawVt1[cycleStep] = vt1;
      rawFwd[cycleStep] = isFwdActive;
      rawPairs[cycleStep] = conducting;
      rawGatePulses[cycleStep] = gatePulse;
    }
  }

  // Build Simulation samples array
  const samples: SimulationSample[] = [];
  for (let i = 0; i < SAMPLES_PER_CYCLE; i++) {
    const angleDeg = (i / SAMPLES_PER_CYCLE) * 360;
    samples.push({
      angleDeg,
      time: i * dt,
      vs: rawVs[i],
      vo: rawVo[i],
      io: rawIo[i],
      is: rawIs[i],
      fwdConduction: rawFwd[i],
      conductingDevices: rawPairs[i],
      vt1: rawVt1[i],
      gatePulse: rawGatePulses[i],
    });
  }

  // Calculate Average & RMS metrics
  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let sumIsSq = 0;
  let sumPower = 0;
  let minIo = Infinity;

  for (let i = 0; i < SAMPLES_PER_CYCLE; i++) {
    const vo = rawVo[i];
    const io = rawIo[i];
    const is = rawIs[i];
    sumVo += vo;
    sumVoSq += vo * vo;
    sumIo += io;
    sumIoSq += io * io;
    sumIsSq += is * is;
    sumPower += vo * io;
    if (io < minIo) minIo = io;
  }

  const avgVo = sumVo / SAMPLES_PER_CYCLE;
  const rmsVo = Math.sqrt(sumVoSq / SAMPLES_PER_CYCLE);
  const avgIo = sumIo / SAMPLES_PER_CYCLE;
  const rmsIo = Math.sqrt(sumIoSq / SAMPLES_PER_CYCLE);
  const rmsIs = Math.sqrt(sumIsSq / SAMPLES_PER_CYCLE);
  const activePower = sumPower / SAMPLES_PER_CYCLE;
  const apparentPower = sourceRms * Math.max(0.001, rmsIs);
  const powerFactor =
    apparentPower > 0.01 ? Math.min(1, Math.max(0, activePower / apparentPower)) : 0;

  const formFactor = Math.abs(avgVo) > 0.1 ? rmsVo / Math.abs(avgVo) : 1;
  const rippleFactor = Math.sqrt(Math.max(0, formFactor * formFactor - 1));
  const isContinuous = !isPureR && minIo > 0.05;

  // Discrete Fourier Transform (FFT) on source current and output voltage
  const harmonicsCurrent = computeFFT(rawIs, frequency, 15);
  const harmonicsVoltage = computeFFT(rawVo, frequency, 15);

  // Source current THD
  const fundamentalCurrent = harmonicsCurrent[1]?.magnitude || 0.001;
  let harmonicSumSq = 0;
  for (let n = 2; n < harmonicsCurrent.length; n++) {
    harmonicSumSq += Math.pow(harmonicsCurrent[n].magnitude, 2);
  }
  const thdCurrent =
    fundamentalCurrent > 0.01 ? (Math.sqrt(harmonicSumSq) / fundamentalCurrent) * 100 : 0;

  const fundPhase = harmonicsCurrent[1]?.phase || 0;
  const displacementFactor = Math.abs(Math.cos(fundPhase));
  const distortionFactor = rmsIs > 0.01 ? fundamentalCurrent / Math.SQRT2 / rmsIs : 1;

  // Theoretical analytical formula calculation
  const { theoreticalAvgVoltage, idealFormulaText, idealFormulaLatex } = getTheoreticalFormula(
    params,
    Vm
  );

  // Calculate conduction intervals for timeline ribbon
  const conductionIntervals = buildConductionIntervals(samples);

  return {
    samples,
    metrics: {
      avgVoltage: avgVo,
      rmsVoltage: rmsVo,
      avgCurrent: avgIo,
      rmsCurrent: rmsIo,
      apparentPower,
      activePower,
      powerFactor,
      displacementFactor,
      distortionFactor,
      rippleFactor,
      formFactor,
      thdCurrent,
      isContinuousConduction: isContinuous,
      theoreticalAvgVoltage,
      idealFormulaText,
      idealFormulaLatex,
    },
    harmonicsCurrent,
    harmonicsVoltage,
    conductionIntervals,
  };
}

/**
 * Computes Fourier harmonic components up to maxHarmonic order.
 */
function computeFFT(signal: number[], baseFreq: number, maxHarmonic: number): HarmonicComponent[] {
  const N = signal.length;
  const result: HarmonicComponent[] = [];

  for (let n = 0; n <= maxHarmonic; n++) {
    let an = 0;
    let bn = 0;
    for (let k = 0; k < N; k++) {
      const theta = (2 * Math.PI * n * k) / N;
      an += signal[k] * Math.cos(theta);
      bn += signal[k] * Math.sin(theta);
    }
    an = (2 / N) * an;
    bn = (2 / N) * bn;

    if (n === 0) {
      const mag = an / 2;
      result.push({
        order: 0,
        freq: 0,
        magnitude: Math.abs(mag),
        phase: 0,
        percentageOfFundamental: 0,
      });
    } else {
      const mag = Math.sqrt(an * an + bn * bn);
      const phase = Math.atan2(-bn, an);
      result.push({
        order: n,
        freq: n * baseFreq,
        magnitude: mag,
        phase,
        percentageOfFundamental: 0,
      });
    }
  }

  const fundMag = result[1]?.magnitude || 1;
  for (let i = 0; i < result.length; i++) {
    result[i].percentageOfFundamental =
      fundMag > 0.001 ? (result[i].magnitude / fundMag) * 100 : 0;
  }

  return result;
}

/**
 * Compute ideal analytical formula and value based on textbook equations.
 */
function getTheoreticalFormula(params: CircuitParameters, Vm: number) {
  const { phase, topology, firingAngle, hasFreewheelingDiode, switches, loadType, backEmf } = params;
  const alphaRad = (firingAngle * Math.PI) / 180;
  const is1P = phase === '1phase';
  const isFull = topology === 'full-bridge';

  const isT1Diode = switches['T1'] === 'diode';
  const hasOnlyDiodes = is1P
    ? isFull
      ? switches['T1'] === 'diode' && switches['T2'] === 'diode' && switches['T3'] === 'diode' && switches['T4'] === 'diode'
      : isT1Diode
    : isFull
    ? Object.values(switches).every((s) => s === 'diode')
    : switches['T1'] === 'diode' && switches['T3'] === 'diode' && switches['T5'] === 'diode';

  const E = (loadType === 'RLE' || loadType === 'R') ? backEmf : 0;

  let theoreticalAvgVoltage = 0;
  let idealFormulaText = '';
  let idealFormulaLatex = '';

  if (is1P && !isFull) {
    if (E > 0 && E < Vm) {
      // 1-Phase Half-Wave with R + Back-EMF load
      const theta1 = Math.asin(E / Vm);
      const theta2 = Math.PI - theta1;
      const thAlpha = isT1Diode ? theta1 : Math.max(alphaRad, theta1);
      theoreticalAvgVoltage =
        (Vm / (2 * Math.PI)) * (Math.cos(thAlpha) - Math.cos(theta2)) +
        E * (1 - (theta2 - thAlpha) / (2 * Math.PI));
      idealFormulaText = 'V_dc = (V_m/2π)(cos θ_on - cos θ₂) + E · (1 - (θ₂ - θ_on)/2π)';
      idealFormulaLatex = 'V_{dc} = \\frac{V_m}{2\\pi}(\\cos\\theta_{on} - \\cos\\theta_2) + E(1 - \\frac{\\theta_2 - \\theta_{on}}{2\\pi})';
    } else if (isT1Diode) {
      theoreticalAvgVoltage = Vm / Math.PI;
      idealFormulaText = 'V_dc = V_m / π = 0.318 V_m';
      idealFormulaLatex = 'V_{dc} = \\frac{V_m}{\\pi}';
    } else {
      theoreticalAvgVoltage = (Vm / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
      idealFormulaText = 'V_dc = (V_m / 2π) · (1 + cos α)';
      idealFormulaLatex = 'V_{dc} = \\frac{V_m}{2\\pi} (1 + \\cos\\alpha)';
    }
  } else if (phase === '1phase' && topology === 'full-bridge') {
    if (hasOnlyDiodes && (!E || E === 0)) {
      theoreticalAvgVoltage = (2 * Vm) / Math.PI;
      idealFormulaText = 'V_dc = 2 · V_m / π';
      idealFormulaLatex = 'V_{dc} = \\frac{2 V_m}{\\pi}';
    } else if (hasFreewheelingDiode || loadType === 'R') {
      theoreticalAvgVoltage = (Vm / Math.PI) * (1 + Math.cos(alphaRad));
      idealFormulaText = 'V_dc = (V_m / π) · (1 + cos α)';
      idealFormulaLatex = 'V_{dc} = \\frac{V_m}{\\pi} (1 + \\cos\\alpha)';
    } else {
      theoreticalAvgVoltage = ((2 * Vm) / Math.PI) * Math.cos(alphaRad);
      idealFormulaText = 'V_dc = (2 · V_m / π) · cos α';
      idealFormulaLatex = 'V_{dc} = \\frac{2 V_m}{\\pi} \\cos\\alpha';
    }
  } else if (phase === '3phase' && topology === 'full-bridge') {
    if (hasOnlyDiodes) {
      theoreticalAvgVoltage = (3 * Math.sqrt(3) * Vm) / Math.PI;
      idealFormulaText = 'V_dc = (3√3 · V_m) / π = 1.654 V_m';
      idealFormulaLatex = 'V_{dc} = \\frac{3\\sqrt{3} V_m}{\\pi}';
    } else {
      theoreticalAvgVoltage = ((3 * Math.sqrt(3) * Vm) / Math.PI) * Math.cos(alphaRad);
      idealFormulaText = 'V_dc = (3√3 · V_m / π) · cos α';
      idealFormulaLatex = 'V_{dc} = \\frac{3\\sqrt{3} V_m}{\\pi} \\cos\\alpha';
    }
  } else {
    // 3-Phase Half-Wave
    theoreticalAvgVoltage = ((3 * Math.sqrt(3) * Vm) / (2 * Math.PI)) * Math.cos(alphaRad);
    idealFormulaText = 'V_dc = (3√3 · V_m / 2π) · cos α';
    idealFormulaLatex = 'V_{dc} = \\frac{3\\sqrt{3} V_m}{2\\pi} \\cos\\alpha';
  }

  return { theoreticalAvgVoltage, idealFormulaText, idealFormulaLatex };
}

/**
 * Builds conduction intervals across 0 to 360 degrees for timeline display.
 */
function buildConductionIntervals(samples: SimulationSample[]) {
  const intervals: {
    startDeg: number;
    endDeg: number;
    label: string;
    isOff?: boolean;
    isFwd?: boolean;
  }[] = [];

  let currentStart = 0;
  let currentLabel = getSampleLabel(samples[0]);
  let currentIsOff = samples[0].conductingDevices.length === 0;
  let currentIsFwd = samples[0].fwdConduction;

  for (let i = 1; i < samples.length; i++) {
    const s = samples[i];
    const label = getSampleLabel(s);
    const isOff = s.conductingDevices.length === 0;
    const isFwd = s.fwdConduction;

    if (label !== currentLabel) {
      intervals.push({
        startDeg: currentStart,
        endDeg: s.angleDeg,
        label: currentLabel,
        isOff: currentIsOff,
        isFwd: currentIsFwd,
      });
      currentStart = s.angleDeg;
      currentLabel = label;
      currentIsOff = isOff;
      currentIsFwd = isFwd;
    }
  }

  intervals.push({
    startDeg: currentStart,
    endDeg: 360,
    label: currentLabel,
    isOff: currentIsOff,
    isFwd: currentIsFwd,
  });

  return intervals;
}

function getSampleLabel(s: SimulationSample): string {
  if (s.fwdConduction) return 'D_FW';
  if (!s.conductingDevices || s.conductingDevices.length === 0) return 'OFF';
  return s.conductingDevices.join(' + ');
}

/**
 * Get instantaneous state at any given electrical angle (0 - 360 deg).
 */
export function getInstantaneousState(
  result: SimulationResult,
  angleDeg: number,
  params: CircuitParameters
): InstantaneousState {
  const normAngle = ((angleDeg % 360) + 360) % 360;
  const idx = Math.min(
    SAMPLES_PER_CYCLE - 1,
    Math.max(0, Math.floor((normAngle / 360) * SAMPLES_PER_CYCLE))
  );
  const sample = result.samples[idx];

  const Vm = Math.sqrt(2) * params.sourceRms;
  const angleRad = (normAngle * Math.PI) / 180;
  const va = Vm * Math.sin(angleRad);
  const vb = Vm * Math.sin(angleRad - (2 * Math.PI) / 3);
  const vc = Vm * Math.sin(angleRad + (2 * Math.PI) / 3);

  let activeDesc = 'Inactive / Off (i = 0)';
  if (sample.fwdConduction) {
    activeDesc = 'FWD Active (Freewheeling)';
  } else if (sample.conductingDevices.length > 0) {
    activeDesc = `Conducting: ${sample.conductingDevices.join(' + ')}`;
  }

  return {
    angleDeg: normAngle,
    time: sample.time,
    sourceVoltages: {
      va,
      vb,
      vc,
      vab: va - vb,
      vbc: vb - vc,
      vca: vc - va,
    },
    outputVoltage: sample.vo,
    outputCurrent: sample.io,
    sourceCurrent: sample.is,
    fwdCurrent: sample.fwdConduction ? sample.io : 0,
    conductingSwitches: sample.conductingDevices,
    activeLoopDescription: activeDesc,
    isFreewheeling: sample.fwdConduction,
    gatePulseActive: sample.gatePulse === 1,
    switchVoltages: {
      T1: sample.vt1,
    },
  };
}
