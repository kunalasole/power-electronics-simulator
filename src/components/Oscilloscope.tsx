/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SimulationResult, InstantaneousState, CircuitParameters } from '../types';
import {
  Layers,
  Activity,
  BarChart2,
  Maximize2,
  Minimize2,
  TrendingUp,
  Eye,
  Waves,
} from 'lucide-react';

export type ScopeViewMode = 'split' | 'current' | 'voltage' | 'channels' | 'fft';

interface OscilloscopeProps {
  result: SimulationResult;
  state: InstantaneousState;
  params: CircuitParameters;
  onSeekAngle: (angleDeg: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  cycles: 1 | 2;
  onToggleCycles: () => void;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  result,
  state,
  params,
  onSeekAngle,
  isFullscreen,
  onToggleFullscreen,
  cycles,
  onToggleCycles,
}) => {
  const [viewMode, setViewMode] = useState<ScopeViewMode>('split');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showVavg, setShowVavg] = useState<boolean>(true);
  const [showIavg, setShowIavg] = useState<boolean>(true);

  // Individual waveform channel visibility toggles
  const [showVo, setShowVo] = useState<boolean>(true);
  const [showVs, setShowVs] = useState<boolean>(true);
  const [showIo, setShowIo] = useState<boolean>(true);
  const [showIs, setShowIs] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Dynamic Auto-scaling for Voltage
  const maxVoltage = useMemo(() => {
    const peakSource = Math.sqrt(2) * params.sourceRms;
    const peakVo = result.samples.reduce((max, s) => {
      const absVo = Math.abs(s.vo);
      return Number.isFinite(absVo) ? Math.max(max, absVo) : max;
    }, peakSource);
    const safePeak = Number.isFinite(peakVo) ? peakVo : 100;
    return Math.max(100, Math.ceil(safePeak / 50) * 50);
  }, [params.sourceRms, result.samples]);

  // Dynamic Auto-scaling for Current (tightly fitted so waveforms are bold and prominent)
  const maxCurrent = useMemo(() => {
    let peak = 0;
    for (const s of result.samples) {
      if (Number.isFinite(s.io) && Math.abs(s.io) > peak) peak = Math.abs(s.io);
      if (Number.isFinite(s.is) && Math.abs(s.is) > peak) peak = Math.abs(s.is);
    }
    if (peak <= 0.05) return 2;
    if (peak < 1) return Math.ceil(peak * 10) / 10 + 0.2;
    if (peak < 5) return Math.ceil(peak) + 0.5;
    if (peak < 15) return Math.ceil(peak) + 1;
    return Math.ceil(peak / 5) * 5 + 2;
  }, [result.samples]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI crisp rendering strictly using parent container dimensions
    const container = canvas.parentElement;
    const rect = container ? container.getBoundingClientRect() : canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.max(1, Math.round(rect.width * dpr));
    const targetH = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    // Idempotent transform reset avoids multiplying scale across animation frames
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;

    // Clear background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, w, h);

    if (viewMode === 'fft') {
      drawFFT(ctx, w, h);
    } else if (viewMode === 'channels') {
      drawChannels(ctx, w, h);
    } else if (viewMode === 'current') {
      drawCurrentOnly(ctx, w, h);
    } else if (viewMode === 'voltage') {
      drawVoltageOnly(ctx, w, h);
    } else {
      drawSplit(ctx, w, h);
    }
  }, [
    result,
    state.angleDeg,
    viewMode,
    showGrid,
    showVavg,
    showIavg,
    showVo,
    showVs,
    showIo,
    showIs,
    cycles,
    maxVoltage,
    maxCurrent,
  ]);

  // --------------------------------------------------------------------------
  // 1. DUAL SPLIT VIEW (Voltage Top 50%, Current Bottom 50%)
  // --------------------------------------------------------------------------
  function drawSplit(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const paddingLeft = 55;
    const paddingRight = 35;
    const paddingTop = 22;
    const paddingBottom = 26;

    const plotW = w - paddingLeft - paddingRight;
    const totalHeight = h - paddingTop - paddingBottom;

    // Equal 48% / 48% split
    const vSectionH = totalHeight * 0.48;
    const iSectionH = totalHeight * 0.48;
    const gap = totalHeight * 0.04;

    const vZeroY = paddingTop + vSectionH / 2;
    const iZeroY = paddingTop + vSectionH + gap + iSectionH / 2;
    const totalDegrees = cycles * 360;

    // Grid Lines
    if (showGrid) {
      drawGrid(ctx, paddingLeft, plotW, paddingTop, h - paddingBottom, totalDegrees);

      // Section zero reference lines
      ctx.setLineDash([]);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, vZeroY);
      ctx.lineTo(paddingLeft + plotW, vZeroY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(paddingLeft, iZeroY);
      ctx.lineTo(paddingLeft + plotW, iZeroY);
      ctx.stroke();
    }

    // Y-Axis Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';

    // Voltage Axis
    ctx.fillText(`${maxVoltage}V`, paddingLeft - 8, paddingTop + 10);
    ctx.fillText(`0V`, paddingLeft - 8, vZeroY + 3);
    ctx.fillText(`-${maxVoltage}V`, paddingLeft - 8, paddingTop + vSectionH);
    ctx.fillText(`[V]`, w - 10, paddingTop + 10);

    // Current Axis
    ctx.fillText(`${maxCurrent.toFixed(1)}A`, paddingLeft - 8, iZeroY - iSectionH / 2 + 10);
    ctx.fillText(`0A`, paddingLeft - 8, iZeroY + 3);
    ctx.fillText(`-${maxCurrent.toFixed(1)}A`, paddingLeft - 8, iZeroY + iSectionH / 2);
    ctx.fillText(`[A]`, w - 10, iZeroY - iSectionH / 2 + 10);

    // Section Titles
    ctx.textAlign = 'left';
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Voltage Waveforms (v_s & v_o)', paddingLeft + 10, paddingTop + 14);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText('Current Waveforms (i_o & i_s)', paddingLeft + 10, iZeroY - iSectionH / 2 + 12);

    const scaleV = (v: number) => vZeroY - (v / maxVoltage) * (vSectionH * 0.44);
    const scaleI = (i: number) => iZeroY - (i / maxCurrent) * (iSectionH * 0.44);

    // Plot Voltage: Source vs (Cyan dashed)
    if (showVs) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let deg = 0; deg <= totalDegrees; deg += 0.5) {
        const s = getSampleAtDeg(deg);
        const x = paddingLeft + (deg / totalDegrees) * plotW;
        const y = scaleV(s.vs);
        if (deg === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Plot Voltage: V_avg Line (Purple dashed)
    if (showVavg) {
      const avgY = scaleV(result.metrics.avgVoltage);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, avgY);
      ctx.lineTo(paddingLeft + plotW, avgY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#c084fc';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`V_avg = ${result.metrics.avgVoltage.toFixed(1)}V`, paddingLeft + 180, avgY - 4);
    }

    // Back-EMF Level E Line (Red / Rose reference line matching textbook reference)
    const effectiveE = (params.loadType === 'RLE' || params.loadType === 'R') ? params.backEmf : 0;
    if (Math.abs(effectiveE) > 0.1) {
      const emfY = scaleV(effectiveE);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, emfY);
      ctx.lineTo(paddingLeft + plotW, emfY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#fb7185';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`EMF (E) = ${effectiveE}V`, paddingLeft + 10, emfY - 4);

      // In 1-Phase Half-Wave, annotate θ1 and θ2 intersection angles
      const peakV = Math.SQRT2 * params.sourceRms;
      if (params.phase === '1phase' && params.topology === 'half-wave' && effectiveE > 0 && effectiveE < peakV) {
        const th1Deg = (Math.asin(effectiveE / peakV) * 180) / Math.PI;
        const th2Deg = 180 - th1Deg;

        [th1Deg, th2Deg].forEach((deg, i) => {
          const markX = paddingLeft + (deg / totalDegrees) * plotW;
          ctx.setLineDash([2, 2]);
          ctx.strokeStyle = '#fb7185';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(markX, vZeroY - vSectionH * 0.44);
          ctx.lineTo(markX, vZeroY + vSectionH * 0.44);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#f43f5e';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(i === 0 ? `θ₁=${th1Deg.toFixed(0)}°` : `θ₂=${th2Deg.toFixed(0)}°`, markX, vZeroY + vSectionH * 0.44 + 10);
        });
      }
    }

    // Plot Voltage: Output vo (Emerald Vibrant Glow)
    if (showVo) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let deg = 0; deg <= totalDegrees; deg += 0.5) {
        const s = getSampleAtDeg(deg);
        const x = paddingLeft + (deg / totalDegrees) * plotW;
        const y = scaleV(s.vo);
        if (deg === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Plot Current: I_avg Line (Orange dashed)
    if (showIavg) {
      const avgIY = scaleI(result.metrics.avgCurrent);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, avgIY);
      ctx.lineTo(paddingLeft + plotW, avgIY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#fb923c';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`I_avg = ${result.metrics.avgCurrent.toFixed(2)}A`, paddingLeft + 180, avgIY - 4);
    }

    // Plot Current: Source is (Cyan / Sky Line Current)
    if (showIs) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let deg = 0; deg <= totalDegrees; deg += 0.5) {
        const s = getSampleAtDeg(deg);
        const x = paddingLeft + (deg / totalDegrees) * plotW;
        const y = scaleI(s.is);
        if (deg === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Plot Current: Load Output io (Bright Golden Amber with area glow)
    if (showIo) {
      // Semi-transparent area fill under io curve
      ctx.beginPath();
      ctx.moveTo(paddingLeft, scaleI(0));
      for (let deg = 0; deg <= totalDegrees; deg += 0.5) {
        const s = getSampleAtDeg(deg);
        const x = paddingLeft + (deg / totalDegrees) * plotW;
        const y = scaleI(s.io);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(paddingLeft + plotW, scaleI(0));
      ctx.closePath();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.fill();

      // Main Stroke Line
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.8;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let deg = 0; deg <= totalDegrees; deg += 0.5) {
        const s = getSampleAtDeg(deg);
        const x = paddingLeft + (deg / totalDegrees) * plotW;
        const y = scaleI(s.io);
        if (deg === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Vertical Cursor Line & Glowing Probe Dots
    drawPlayheadCursor(
      ctx,
      paddingLeft,
      plotW,
      paddingTop,
      h - paddingBottom,
      totalDegrees,
      scaleV(state.outputVoltage),
      scaleI(state.outputCurrent)
    );
  }

  // --------------------------------------------------------------------------
  // 2. DEDICATED FULL-HEIGHT CURRENT WAVEFORMS VIEW
  // --------------------------------------------------------------------------
  function drawCurrentOnly(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const paddingLeft = 55;
    const paddingRight = 35;
    const paddingTop = 26;
    const paddingBottom = 28;

    const plotW = w - paddingLeft - paddingRight;
    const plotH = h - paddingTop - paddingBottom;
    const zeroY = paddingTop + plotH / 2;
    const totalDegrees = cycles * 360;

    // Grid
    if (showGrid) {
      drawGrid(ctx, paddingLeft, plotW, paddingTop, h - paddingBottom, totalDegrees);

      ctx.setLineDash([]);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, zeroY);
      ctx.lineTo(paddingLeft + plotW, zeroY);
      ctx.stroke();
    }

    // Y Axis Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${maxCurrent.toFixed(1)}A`, paddingLeft - 8, paddingTop + 10);
    ctx.fillText(`0A`, paddingLeft - 8, zeroY + 3);
    ctx.fillText(`-${maxCurrent.toFixed(1)}A`, paddingLeft - 8, paddingTop + plotH);
    ctx.fillText(`[A]`, w - 10, paddingTop + 10);

    // Title & Live Info Banner
    ctx.textAlign = 'left';
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(
      `Dedicated Current Waveforms: Load Current (i_o) & Source Current (i_s)`,
      paddingLeft + 10,
      paddingTop + 14
    );

    const scaleI = (i: number) => zeroY - (i / maxCurrent) * (plotH * 0.44);

    // I_avg Line
    if (showIavg) {
      const avgY = scaleI(result.metrics.avgCurrent);
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, avgY);
      ctx.lineTo(paddingLeft + plotW, avgY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#fb923c';
      ctx.font = '11px monospace';
      ctx.fillText(
        `I_dc (Avg Load Current) = ${result.metrics.avgCurrent.toFixed(2)} A (I_rms = ${result.metrics.rmsCurrent.toFixed(2)} A)`,
        paddingLeft + 15,
        avgY - 6
      );
    }

    // Source Current is (Cyan)
    if (showIs) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let deg = 0; deg <= totalDegrees; deg += 0.5) {
        const s = getSampleAtDeg(deg);
        const x = paddingLeft + (deg / totalDegrees) * plotW;
        const y = scaleI(s.is);
        if (deg === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Load Output Current io (Amber Glow + Fill)
    if (showIo) {
      // Area Fill
      ctx.beginPath();
      ctx.moveTo(paddingLeft, scaleI(0));
      for (let deg = 0; deg <= totalDegrees; deg += 0.5) {
        const s = getSampleAtDeg(deg);
        const x = paddingLeft + (deg / totalDegrees) * plotW;
        const y = scaleI(s.io);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(paddingLeft + plotW, scaleI(0));
      ctx.closePath();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
      ctx.fill();

      // Bold Stroke
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let deg = 0; deg <= totalDegrees; deg += 0.5) {
        const s = getSampleAtDeg(deg);
        const x = paddingLeft + (deg / totalDegrees) * plotW;
        const y = scaleI(s.io);
        if (deg === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Playhead
    drawPlayheadCursor(
      ctx,
      paddingLeft,
      plotW,
      paddingTop,
      h - paddingBottom,
      totalDegrees,
      null,
      scaleI(state.outputCurrent)
    );
  }

  // --------------------------------------------------------------------------
  // 3. DEDICATED FULL-HEIGHT VOLTAGE WAVEFORMS VIEW
  // --------------------------------------------------------------------------
  function drawVoltageOnly(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const paddingLeft = 55;
    const paddingRight = 35;
    const paddingTop = 26;
    const paddingBottom = 28;

    const plotW = w - paddingLeft - paddingRight;
    const plotH = h - paddingTop - paddingBottom;
    const zeroY = paddingTop + plotH / 2;
    const totalDegrees = cycles * 360;

    // Grid
    if (showGrid) {
      drawGrid(ctx, paddingLeft, plotW, paddingTop, h - paddingBottom, totalDegrees);

      ctx.setLineDash([]);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, zeroY);
      ctx.lineTo(paddingLeft + plotW, zeroY);
      ctx.stroke();
    }

    // Y Axis Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${maxVoltage}V`, paddingLeft - 8, paddingTop + 10);
    ctx.fillText(`0V`, paddingLeft - 8, zeroY + 3);
    ctx.fillText(`-${maxVoltage}V`, paddingLeft - 8, paddingTop + plotH);
    ctx.fillText(`[V]`, w - 10, paddingTop + 10);

    // Title
    ctx.textAlign = 'left';
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(
      `Dedicated Voltage Waveforms: Source Voltage (v_s) & Rectified Output (v_o)`,
      paddingLeft + 10,
      paddingTop + 14
    );

    const scaleV = (v: number) => zeroY - (v / maxVoltage) * (plotH * 0.44);

    // Source vs
    if (showVs) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let deg = 0; deg <= totalDegrees; deg += 0.5) {
        const s = getSampleAtDeg(deg);
        const x = paddingLeft + (deg / totalDegrees) * plotW;
        const y = scaleV(s.vs);
        if (deg === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // V_avg
    if (showVavg) {
      const avgY = scaleV(result.metrics.avgVoltage);
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, avgY);
      ctx.lineTo(paddingLeft + plotW, avgY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#c084fc';
      ctx.font = '11px monospace';
      ctx.fillText(
        `V_dc (Avg DC Voltage) = ${result.metrics.avgVoltage.toFixed(1)} V`,
        paddingLeft + 15,
        avgY - 6
      );
    }

    // Back-EMF Level E Line (Red / Rose reference line)
    const effectiveE = (params.loadType === 'RLE' || params.loadType === 'R') ? params.backEmf : 0;
    if (Math.abs(effectiveE) > 0.1) {
      const emfY = scaleV(effectiveE);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, emfY);
      ctx.lineTo(paddingLeft + plotW, emfY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#fb7185';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`EMF (E) = ${effectiveE}V`, paddingLeft + 15, emfY - 6);

      const peakV = Math.SQRT2 * params.sourceRms;
      if (params.phase === '1phase' && params.topology === 'half-wave' && effectiveE > 0 && effectiveE < peakV) {
        const th1Deg = (Math.asin(effectiveE / peakV) * 180) / Math.PI;
        const th2Deg = 180 - th1Deg;

        [th1Deg, th2Deg].forEach((deg, i) => {
          const markX = paddingLeft + (deg / totalDegrees) * plotW;
          ctx.setLineDash([2, 2]);
          ctx.strokeStyle = '#fb7185';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(markX, zeroY - plotH * 0.44);
          ctx.lineTo(markX, zeroY + plotH * 0.44);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#f43f5e';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(i === 0 ? `θ₁=${th1Deg.toFixed(0)}°` : `θ₂=${th2Deg.toFixed(0)}°`, markX, zeroY + plotH * 0.44 + 10);
        });
      }
    }

    // Output vo
    if (showVo) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let deg = 0; deg <= totalDegrees; deg += 0.5) {
        const s = getSampleAtDeg(deg);
        const x = paddingLeft + (deg / totalDegrees) * plotW;
        const y = scaleV(s.vo);
        if (deg === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Cursor
    drawPlayheadCursor(
      ctx,
      paddingLeft,
      plotW,
      paddingTop,
      h - paddingBottom,
      totalDegrees,
      scaleV(state.outputVoltage),
      null
    );
  }

  // --------------------------------------------------------------------------
  // 4. MULTI-CHANNEL OSCILLOSCOPE VIEW
  // --------------------------------------------------------------------------
  function drawChannels(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const paddingLeft = 65;
    const paddingRight = 30;
    const paddingTop = 15;
    const paddingBottom = 25;
    const plotW = w - paddingLeft - paddingRight;

    const channels = [
      { name: 'CH1: v_s (Source V)', color: '#0284c7', max: maxVoltage, unit: 'V' },
      { name: 'CH2: v_o (Load V)', color: '#10b981', max: maxVoltage, unit: 'V' },
      { name: 'CH3: i_o (Load Current)', color: '#f59e0b', max: maxCurrent, unit: 'A' },
      { name: 'CH4: i_s (Source Current)', color: '#38bdf8', max: maxCurrent, unit: 'A' },
      { name: 'CH5: v_T1 (Device Voltage)', color: '#f43f5e', max: maxVoltage, unit: 'V' },
      { name: 'CH6: Gate Pulses', color: '#a855f7', max: 1.5, unit: '' },
    ];

    const chCount = channels.length;
    const chHeight = (h - paddingTop - paddingBottom) / chCount;
    const totalDegrees = cycles * 360;

    channels.forEach((ch, idx) => {
      const topY = paddingTop + idx * chHeight;
      const zeroY = topY + chHeight / 2;

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, zeroY);
      ctx.lineTo(paddingLeft + plotW, zeroY);
      ctx.stroke();

      ctx.fillStyle = ch.color;
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(ch.name, paddingLeft + 8, topY + 13);

      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      for (let deg = 0; deg <= totalDegrees; deg += 0.5) {
        const s = getSampleAtDeg(deg);
        let val = 0;
        if (idx === 0) val = s.vs;
        else if (idx === 1) val = s.vo;
        else if (idx === 2) val = s.io;
        else if (idx === 3) val = s.is;
        else if (idx === 4) val = s.vt1;
        else if (idx === 5) val = s.gatePulse;

        const x = paddingLeft + (deg / totalDegrees) * plotW;
        const y = zeroY - (val / ch.max) * (chHeight * 0.42);

        if (deg === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    const cursorX = paddingLeft + ((state.angleDeg % totalDegrees) / totalDegrees) * plotW;
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(cursorX, paddingTop);
    ctx.lineTo(cursorX, h - paddingBottom);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // --------------------------------------------------------------------------
  // 5. HARMONICS (FFT) VIEW
  // --------------------------------------------------------------------------
  function drawFFT(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const paddingLeft = 50;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 40;
    const plotW = w - paddingLeft - paddingRight;
    const plotH = h - paddingTop - paddingBottom;

    ctx.fillStyle = '#f8fafc';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Harmonic Spectrum Analysis of Source Current i_s (FFT)', paddingLeft, paddingTop - 12);

    const harmonics = result.harmonicsCurrent.slice(0, 14);
    const barCount = harmonics.length;
    const slotW = plotW / barCount;
    const barWidth = Math.min(38, slotW * 0.65);
    const maxPercent = 120;

    [0, 25, 50, 75, 100].forEach((pct) => {
      const y = paddingTop + plotH - (pct / maxPercent) * plotH;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${pct}%`, paddingLeft - 6, y + 3);
    });

    harmonics.forEach((hItem, idx) => {
      const x = paddingLeft + idx * slotW + (slotW - barWidth) / 2;
      const pct = idx === 1 ? 100 : Math.min(maxPercent, hItem.percentageOfFundamental);
      const barH = (pct / maxPercent) * plotH;
      const y = paddingTop + plotH - barH;

      let barColor = '#0284c7';
      if (idx === 1) barColor = '#38bdf8';
      else if (idx % 3 === 0) barColor = '#f59e0b';
      else if (idx % 2 === 0) barColor = '#ef4444';
      else barColor = '#10b981';

      ctx.fillStyle = barColor;
      ctx.fillRect(x, y, barWidth, barH);

      if (pct > 3) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${pct.toFixed(1)}%`, x + barWidth / 2, y - 4);
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      const label = idx === 0 ? 'DC' : `n=${idx}`;
      ctx.fillText(label, x + barWidth / 2, paddingTop + plotH + 15);
      ctx.fillText(`${hItem.freq}Hz`, x + barWidth / 2, paddingTop + plotH + 26);
    });

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(w - 220, paddingTop + 5, 200, 60, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Source Current THD_i: ${result.metrics.thdCurrent.toFixed(1)}%`, w - 208, paddingTop + 24);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`Displacement Factor cos(φ1): ${result.metrics.displacementFactor.toFixed(3)}`, w - 208, paddingTop + 40);
    ctx.fillText(`Power Factor: ${result.metrics.powerFactor.toFixed(3)}`, w - 208, paddingTop + 54);
  }

  // --------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // --------------------------------------------------------------------------
  function getSampleAtDeg(deg: number) {
    const sampleIdx = Math.floor(((deg % 360) / 360) * result.samples.length);
    return result.samples[sampleIdx] || { vs: 0, vo: 0, io: 0, is: 0, gatePulse: 0 };
  }

  function drawGrid(
    ctx: CanvasRenderingContext2D,
    paddingLeft: number,
    plotW: number,
    paddingTop: number,
    bottomY: number,
    totalDegrees: number
  ) {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    const degreeSteps = [0, 90, 180, 270, 360, 450, 540, 630, 720];
    degreeSteps.forEach((deg) => {
      if (deg <= totalDegrees) {
        const x = paddingLeft + (deg / totalDegrees) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, paddingTop);
        ctx.lineTo(x, bottomY);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${deg}°`, x, bottomY + 14);
      }
    });
  }

  function drawPlayheadCursor(
    ctx: CanvasRenderingContext2D,
    paddingLeft: number,
    plotW: number,
    paddingTop: number,
    bottomY: number,
    totalDegrees: number,
    dotVoY: number | null,
    dotIoY: number | null
  ) {
    const cursorX = paddingLeft + ((state.angleDeg % totalDegrees) / totalDegrees) * plotW;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cursorX, paddingTop);
    ctx.lineTo(cursorX, bottomY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (dotVoY !== null) {
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cursorX, dotVoY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (dotIoY !== null) {
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cursorX, dotIoY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  // Interactive mouse scrubbing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    handleScrub(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      handleScrub(e);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleScrub = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const paddingLeft = 55;
    const paddingRight = 35;
    const plotW = rect.width - paddingLeft - paddingRight;

    if (x >= paddingLeft && x <= rect.width - paddingRight) {
      const frac = (x - paddingLeft) / plotW;
      const totalDegrees = cycles * 360;
      const angle = (frac * totalDegrees) % 360;
      onSeekAngle(angle);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
      {/* Top Header: View Tabs & Channel Controls - Fixed height eliminates oscillation */}
      <div className="h-11 shrink-0 flex items-center justify-between px-3 bg-slate-950/90 border-b border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'split'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dual Split (V & I)</span>
          </button>

          <button
            onClick={() => setViewMode('current')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'current'
                ? 'bg-amber-600 text-white shadow-sm font-bold'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Current Waveforms (i_o & i_s)</span>
          </button>

          <button
            onClick={() => setViewMode('voltage')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'voltage'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Voltage (v_s & v_o)</span>
          </button>

          <button
            onClick={() => setViewMode('channels')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'channels'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Oscilloscope Channels</span>
            <span className="sm:hidden">Channels</span>
          </button>

          <button
            onClick={() => setViewMode('fft')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'fft'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>FFT</span>
          </button>
        </div>

        {/* Display Toggles */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Cycle count */}
          <button
            onClick={onToggleCycles}
            className="px-2 py-1 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            {cycles === 1 ? '1 Cycle' : '2 Cycles'}
          </button>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-1 text-xs font-medium rounded-lg border transition-colors ${
              showGrid
                ? 'bg-slate-800 text-cyan-400 border-cyan-800/60'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            # Grid
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Oscilloscope'}
            className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Subheader: Active Channel Enable / Visibility Toolbar - Rigid height h-9 */}
      <div className="h-9 shrink-0 flex items-center justify-between px-3 bg-slate-950/80 border-b border-slate-800/70 text-xs gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Channels:
          </span>

          {/* Output Voltage v_o */}
          <button
            onClick={() => setShowVo(!showVo)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
              showVo
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 font-bold'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 opacity-60'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showVo ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            <span>v_o (Load V)</span>
          </button>

          {/* Source Voltage v_s */}
          <button
            onClick={() => setShowVs(!showVs)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
              showVs
                ? 'bg-sky-950/80 text-sky-300 border-sky-700/80 font-bold'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 opacity-60'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showVs ? 'bg-sky-400' : 'bg-slate-600'}`} />
            <span>v_s (Source V)</span>
          </button>

          {/* Load Current i_o */}
          <button
            onClick={() => setShowIo(!showIo)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
              showIo
                ? 'bg-amber-950/90 text-amber-300 border-amber-600/90 font-bold shadow-sm shadow-amber-950'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 opacity-60'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showIo ? 'bg-amber-400' : 'bg-slate-600'}`} />
            <span>i_o (Load Current)</span>
          </button>

          {/* Source Current i_s */}
          <button
            onClick={() => setShowIs(!showIs)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
              showIs
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80 font-bold'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 opacity-60'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showIs ? 'bg-cyan-400' : 'bg-slate-600'}`} />
            <span>i_s (Line Current)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* V_avg Toggle */}
          <button
            onClick={() => setShowVavg(!showVavg)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
              showVavg
                ? 'bg-purple-950/80 text-purple-300 border-purple-700 font-semibold'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 opacity-60'
            }`}
          >
            <span>V_avg</span>
          </button>

          {/* I_avg Toggle */}
          <button
            onClick={() => setShowIavg(!showIavg)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
              showIavg
                ? 'bg-orange-950/80 text-orange-300 border-orange-700 font-semibold'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 opacity-60'
            }`}
          >
            <span>I_avg</span>
          </button>
        </div>
      </div>

      {/* Main Oscilloscope Canvas */}
      <div className="relative flex-1 min-h-[380px] md:min-h-[420px] max-h-[520px] w-full bg-slate-950 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="absolute inset-0 w-full h-full block"
        />
      </div>

      {/* Conduction Ribbon Timeline */}
      <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">
            Active Pair
          </span>

          <div className="flex-1 flex h-6 bg-slate-900 rounded overflow-hidden border border-slate-800">
            {result.conductionIntervals.map((interval, idx) => {
              const widthPct = ((interval.endDeg - interval.startDeg) / 360) * 100;
              const isCurrentActive =
                state.angleDeg >= interval.startDeg && state.angleDeg < interval.endDeg;

              let bgClass = 'bg-slate-800 text-slate-400';
              if (interval.isFwd) {
                bgClass = isCurrentActive
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-amber-950/60 text-amber-300';
              } else if (!interval.isOff) {
                bgClass = isCurrentActive
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-emerald-950/60 text-emerald-300';
              }

              return (
                <div
                  key={idx}
                  style={{ width: `${widthPct}%` }}
                  className={`flex items-center justify-center text-[10px] font-mono border-r border-slate-900/60 transition-colors ${bgClass}`}
                  title={`${interval.label}: ${interval.startDeg.toFixed(0)}° - ${interval.endDeg.toFixed(0)}°`}
                >
                  <span className="truncate px-1">{interval.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Scrubber Angle wt */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Angle ωt:</span>
          </div>

          <input
            type="range"
            min="0"
            max="360"
            step="0.5"
            value={state.angleDeg}
            onChange={(e) => onSeekAngle(parseFloat(e.target.value))}
            className="flex-1 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />

          <span className="text-xs font-mono font-bold text-white min-w-[55px] text-right">
            {state.angleDeg.toFixed(1)}°
          </span>
        </div>
      </div>
    </div>
  );
};
