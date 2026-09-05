/**
 * Tactical Vertical Altitude Zoom Slider Controller
 * Interpolates camera altitude exponentially between 45,000 km (Deep Space GEO) down to 2 km (Facility level).
 * Optimized for mobile touchscreens (<768px) and desktop with tactile +/- step buttons and touch isolation.
 */

import { audio } from '../services/audioService.js';

const MIN_ALT_METERS = 2000; // 2 km
const MAX_ALT_METERS = 45000000; // 45,000 km
const LOG_MIN = Math.log10(MIN_ALT_METERS);
const LOG_MAX = Math.log10(MAX_ALT_METERS);

export class ZoomSlider {
  /**
   * @param {Object} options
   * @param {GlobeManager} options.globeManager
   */
  constructor({ globeManager }) {
    this.globeManager = globeManager;
    this.container = document.getElementById('hud-zoom-slider-container');
    this.hitbox = document.getElementById('hud-zoom-track-hitbox') || document.getElementById('hud-zoom-track');
    this.track = document.getElementById('hud-zoom-track');
    this.thumb = document.getElementById('hud-zoom-thumb');
    this.label = document.getElementById('hud-zoom-altitude-label');
    this.btnIn = document.getElementById('btn-zoom-in');
    this.btnOut = document.getElementById('btn-zoom-out');
    this.isDragging = false;

    this.initEvents();
  }

  /**
   * Convert altitude in meters to 0.0 - 1.0 normalized slider fraction
   * 1.0 = top (MAX_ALT 45,000 km), 0.0 = bottom (MIN_ALT 2 km)
   */
  _altToFraction(altMeters) {
    const clamped = Math.max(MIN_ALT_METERS, Math.min(MAX_ALT_METERS, altMeters));
    const logVal = Math.log10(clamped);
    return (logVal - LOG_MIN) / (LOG_MAX - LOG_MIN);
  }

  /**
   * Convert 0.0 - 1.0 fraction to altitude in meters
   */
  _fractionToAlt(fraction) {
    const clamped = Math.max(0.0, Math.min(1.0, fraction));
    const logVal = LOG_MIN + clamped * (LOG_MAX - LOG_MIN);
    return Math.pow(10, logVal);
  }

  initEvents() {
    if (!this.track || !this.thumb) return;

    // 1. Isolate the zoom slider container from Cesium 3D canvas touch navigation
    if (this.container) {
      const stopAll = (e) => {
        e.stopPropagation();
      };
      this.container.addEventListener('touchstart', stopAll, { passive: false });
      this.container.addEventListener('touchmove', stopAll, { passive: false });
      this.container.addEventListener('pointerdown', stopAll);
    }

    // 2. Tactile Step Buttons (+ Zoom In, - Zoom Out)
    if (this.btnIn) {
      this.btnIn.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playClick();
        this.stepZoom(-1); // Zoom in (descend)
      });
      this.btnIn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    }

    if (this.btnOut) {
      this.btnOut.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playClick();
        this.stepZoom(1); // Zoom out (ascend)
      });
      this.btnOut.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    }

    // 3. Pointer & Mouse Dragging
    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      e.stopPropagation();
      this._handlePointerInput(e.clientY);
    };

    const onPointerUp = (e) => {
      if (this.isDragging) {
        e.stopPropagation();
        this.isDragging = false;
        document.body.classList.remove('select-none');
      }
    };

    const targetEl = this.hitbox || this.track;

    targetEl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.isDragging = true;
      document.body.classList.add('select-none');
      this._handlePointerInput(e.clientY);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp, { once: true });
    });

    // 4. Mobile Touch Dragging with guaranteed stopPropagation
    targetEl.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.touches && e.touches.length > 0) {
        this.isDragging = true;
        this._handlePointerInput(e.touches[0].clientY);
      }
    }, { passive: false });

    targetEl.addEventListener('touchmove', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (this.isDragging && e.touches && e.touches.length > 0) {
        this._handlePointerInput(e.touches[0].clientY);
      }
    }, { passive: false });

    const stopTouchDrag = (e) => {
      e.stopPropagation();
      this.isDragging = false;
    };
    targetEl.addEventListener('touchend', stopTouchDrag, { passive: false });
    targetEl.addEventListener('touchcancel', stopTouchDrag, { passive: false });

    // 5. Preset Clickable Markers
    const marks = document.querySelectorAll('.zoom-preset-mark');
    marks.forEach(mark => {
      mark.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playClick();
        const altKm = parseFloat(mark.getAttribute('data-alt-km'));
        if (altKm) {
          this.globeManager.setCameraAltitude(altKm * 1000, 1.2);
        }
      });
      mark.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });
  }

  /**
   * Step camera zoom incrementally
   * @param {number} direction -1 = Zoom In (lower altitude), +1 = Zoom Out (higher altitude)
   */
  stepZoom(direction) {
    const currentAlt = this.globeManager.getCameraAltitude();
    const currentFraction = this._altToFraction(currentAlt);
    // Step by 0.12 of logarithmic altitude range (~2.5x distance change)
    const stepDelta = 0.12 * direction;
    const newFraction = Math.max(0.0, Math.min(1.0, currentFraction + stepDelta));
    const targetAlt = this._fractionToAlt(newFraction);
    this.globeManager.setCameraAltitude(targetAlt, 0.35);
    this._renderThumb(newFraction, targetAlt);
  }

  _handlePointerInput(clientY) {
    const rect = this.track.getBoundingClientRect();
    const offsetY = clientY - rect.top;
    // Top of track is 1.0 (MAX_ALT), bottom is 0.0 (MIN_ALT)
    const rawFraction = 1.0 - (offsetY / rect.height);
    const fraction = Math.max(0.0, Math.min(1.0, rawFraction));

    const targetAlt = this._fractionToAlt(fraction);
    this.globeManager.setCameraAltitude(targetAlt, 0.25);
    this._renderThumb(fraction, targetAlt);
  }

  _renderThumb(fraction, altMeters) {
    if (!this.thumb) return;

    // percentage from bottom
    const percent = fraction * 100;
    this.thumb.style.bottom = `${percent}%`;

    if (this.label) {
      if (altMeters >= 1000000) {
        this.label.textContent = `${(altMeters / 1000000).toFixed(1)}M km`;
      } else if (altMeters >= 1000) {
        this.label.textContent = `${Math.round(altMeters / 1000).toLocaleString()} km`;
      } else {
        this.label.textContent = `${Math.round(altMeters)} m`;
      }
    }
  }

  /**
   * Called on each frame to synchronize slider thumb with real camera position
   */
  update() {
    if (this.isDragging) return;

    const currentAlt = this.globeManager.getCameraAltitude();
    const fraction = this._altToFraction(currentAlt);
    this._renderThumb(fraction, currentAlt);
  }
}
