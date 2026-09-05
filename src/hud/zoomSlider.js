/**
 * Tactical Vertical Altitude Zoom Slider Controller
 * Interpolates camera altitude exponentially between 45,000 km (Deep Space GEO) down to 2 km (Facility level).
 */

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
    this.track = document.getElementById('hud-zoom-track');
    this.thumb = document.getElementById('hud-zoom-thumb');
    this.label = document.getElementById('hud-zoom-altitude-label');
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

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      this._handlePointerInput(e);
    };

    const onPointerUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        document.body.classList.remove('select-none');
      }
    };

    this.track.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      document.body.classList.add('select-none');
      this._handlePointerInput(e);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp, { once: true });
    });

    // Mark presets click handlers
    const marks = document.querySelectorAll('.zoom-preset-mark');
    marks.forEach(mark => {
      mark.addEventListener('click', (e) => {
        e.stopPropagation();
        const altKm = parseFloat(mark.getAttribute('data-alt-km'));
        if (altKm) {
          this.globeManager.setCameraAltitude(altKm * 1000, 1.2);
        }
      });
    });
  }

  _handlePointerInput(e) {
    const rect = this.track.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    // Top of track is 1.0 (MAX_ALT), bottom is 0.0 (MIN_ALT)
    const rawFraction = 1.0 - (offsetY / rect.height);
    const fraction = Math.max(0.0, Math.min(1.0, rawFraction));

    const targetAlt = this._fractionToAlt(fraction);
    this.globeManager.setCameraAltitude(targetAlt, 0.4);
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
