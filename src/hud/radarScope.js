/**
 * 2D Tactical Polar Radar Scope
 * Renders Azimuth-Elevation sky radar from the viewpoint of Abuja Ground Station.
 */

export class RadarScope {
  /**
   * @param {HTMLCanvasElement} canvas 
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sweepAngle = 0;
    this.target = null; // { az: number, el: number, isAcquired: boolean, name: string }
    this.trail = [];
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 240) * dpr;
    this.canvas.height = (rect.height || 240) * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width || 240;
    this.height = rect.height || 240;
    this.center = { x: this.width / 2, y: this.height / 2 };
    this.radius = Math.min(this.width, this.height) / 2 - 16;
  }

  /**
   * Update target position on radar
   * @param {Object} lookAngles { azimuth, elevation, isAcquired }
   * @param {string} name Satellite name
   */
  updateTarget(lookAngles, name = 'SAT') {
    if (!lookAngles) {
      this.target = null;
      return;
    }

    this.target = {
      az: lookAngles.azimuth,
      el: lookAngles.elevation,
      isAcquired: lookAngles.isAcquired,
      hasLos: lookAngles.hasLos,
      name
    };

    // Add to blip trail
    if (this.trail.length > 20) this.trail.shift();
    this.trail.push({
      az: lookAngles.azimuth,
      el: lookAngles.elevation,
      timestamp: Date.now()
    });
  }

  /**
   * Render frame (called in 60fps loop)
   */
  render() {
    const ctx = this.ctx;
    const { x: cx, y: cy } = this.center;
    const r = this.radius;

    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Background Grid & Outer Ring
    ctx.save();
    
    // Polar background
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 15, 30, 0.75)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.stroke();

    // Elevation Rings: 0° (outer r), 30° (2/3 r), 60° (1/3 r), 90° (center 0)
    const elRings = [
      { el: '60°', rad: r * 0.33 },
      { el: '30°', rad: r * 0.66 },
      { el: '0°', rad: r }
    ];

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.font = '9px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';

    elRings.forEach(ring => {
      ctx.beginPath();
      ctx.arc(cx, cy, ring.rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText(ring.el, cx + 4, cy - ring.rad + 10);
    });

    // 5° Threshold Ring (LOS Acquisition Limit)
    const losLimitRad = r * (1 - (5 / 90));
    ctx.beginPath();
    ctx.arc(cx, cy, losLimitRad, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Crosshairs & Cardinal Ticks (N, E, S, W)
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.stroke();

    // Cardinal Labels
    ctx.font = 'bold 10px "Share Tech Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('N (0°)', cx, cy - r - 4);
    ctx.fillText('S (180°)', cx, cy + r + 12);
    ctx.textAlign = 'left';
    ctx.fillText('E (90°)', cx + r + 4, cy + 3);
    ctx.textAlign = 'right';
    ctx.fillText('W (270°)', cx - r - 4, cy + 3);

    // 2. Sweeping Radar Phosphor Beam
    this.sweepAngle = (this.sweepAngle + 0.035) % (Math.PI * 2);

    const sweepGrad = ctx.createConicGradient(this.sweepAngle - Math.PI / 2, cx, cy);
    sweepGrad.addColorStop(0, 'rgba(0, 240, 255, 0.28)');
    sweepGrad.addColorStop(0.12, 'rgba(0, 240, 255, 0.0)');
    sweepGrad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = sweepGrad;
    ctx.fill();

    // Leading sweep line
    const lx = cx + Math.cos(this.sweepAngle) * r;
    const ly = cy + Math.sin(this.sweepAngle) * r;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(lx, ly);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Target Satellite Blip
    if (this.target) {
      const azRad = (this.target.az - 90) * (Math.PI / 180);
      // Elevation from 0 to 90 mapped from radius to 0 (center is 90 zenith)
      const clampedEl = Math.max(0, Math.min(90, this.target.el));
      const targetDist = r * (1 - (clampedEl / 90));

      const bx = cx + Math.cos(azRad) * targetDist;
      const by = cy + Math.sin(azRad) * targetDist;

      const isAcquired = this.target.isAcquired;
      const hasLos = this.target.hasLos;

      const blipColor = isAcquired ? '#10b981' : (hasLos ? '#f59e0b' : '#ef4444');

      // Blip Halo / Pulse
      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fillStyle = isAcquired ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.25)';
      ctx.fill();

      // Blip Core
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fillStyle = blipColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Target Label
      ctx.textAlign = 'left';
      ctx.font = 'bold 9px "Share Tech Mono", monospace';
      ctx.fillStyle = blipColor;
      ctx.fillText(`${this.target.name} [${this.target.el.toFixed(1)}°]`, bx + 7, by - 4);
    }

    ctx.restore();
  }
}
