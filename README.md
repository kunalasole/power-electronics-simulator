# Rectifier Lab by Kunal Asole (24EE10017)

An interactive, high-precision power electronics simulation web application for single-phase and three-phase rectifiers and phase-controlled converters with R, RL, and RLE loads.

![Converter Simulator](https://raw.githubusercontent.com/kunalasole100/converter-simulator/main/screenshot.png) <!-- Replace with your screenshot if desired -->

## Features

- **Converter Topologies**:
  - 1-Phase Half-Wave (Diode / Thyristor)
  - 1-Phase Full-Bridge / Mid-point (Diode / Thyristor)
  - 3-Phase Half-Wave (Diode / Thyristor)
  - 3-Phase Full-Bridge (Diode / Thyristor)
- **Flexible Load Modeling**:
  - Resistive ($R$)
  - Inductive ($R-L$, Inductance up to 10 H)
  - Active Back-EMF ($R-L-E$, Back-EMF up to 300 V)
  - Optional Freewheeling Diode (FWD)
- **Real-Time Interactive Oscilloscope**:
  - Split View, Dual-Channel, Voltage-only, and Current-only scopes
  - Dynamic auto-scaling and manual volts/div & time/div
  - Measurement cursor and playhead tracking
- **Dynamic Animated Circuit Schematic**:
  - Exact conduction branch visualization showing active thyristor/diode pairs
  - Accurate physical current isolation across positive and negative half-cycles
- **Fourier / Harmonics & Performance Metrics**:
  - Average DC Voltage ($V_{dc}$), RMS Voltage ($V_{rms}$)
  - Ripple Factor (RF), Form Factor (FF), Total Harmonic Distortion (THD)
  - Power Factor ($PF$), Rectification Efficiency ($\eta$), Crest Factor

---

## Getting Started Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ or 20+ recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation & Run

1. Clone or extract the repository:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

---

## Building for Production

To create an optimized production build:

```bash
npm run build
```

The output files will be in the `dist/` directory.

---

## Deploying to GitHub Pages

1. In `vite.config.ts`, ensure `base` is set to `./` or `/<your-repo-name>/`.
2. Push your project to GitHub (see instructions in the user guide).
3. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, choose **GitHub Actions**.
   - Select the **Static HTML** or **Vite** starter workflow to deploy automatically on push.
