/**
 * Tactical HUD Controls & Event Handlers
 * Manages camera modes, satellite switching, simulation rate, layer toggles,
 * landmarks fly-tos, optics cycler, and 'H' hotkey HUD visibility.
 */

import { audio } from '../services/audioService.js';
import { SATELLITE_CATALOG, GROUND_STATIONS } from '../config/satellites.js';
import { LANDMARKS } from '../config/landmarks.js';

export class ControlsManager {
  /**
   * @param {Object} options
   * @param {Function} options.onSatelliteChange
   * @param {Function} options.onCameraModeChange
   * @param {Function} options.onLandmarkSelect
   * @param {Function} options.onLayerToggle
   * @param {Function} options.onOpticsCycle
   * @param {Function} options.onTimeScaleChange
   * @param {Function} options.onExportTelemetry
   */
  constructor(options = {}) {
    this.options = options;
    this.currentSatId = 'nigcomsat-1r';
    this.cameraLocked = false;
    this.cameraMode = 'free'; // 'free' | 'track' | 'chase' | 'topdown' | 'ground'
    this.timeScale = 1;
    this.isPaused = false;
    this.hudVisible = true;
    this.opticsMode = 'NORMAL';
    this.layers = {
      boundaries: true,
      orbit: true,
      footprint: true,
      groundLink: true,
      firms: false
    };
    this.initListeners();
  }

  initListeners() {
    // 1. Satellite Selection Tabs
    const satBtns = document.querySelectorAll('.sat-select-btn');
    satBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const satId = btn.getAttribute('data-sat-id');
        if (satId && satId !== this.currentSatId) {
          audio.playClick();
          this.currentSatId = satId;
          this._updateSatButtonStyles();
          if (this.options.onSatelliteChange) {
            this.options.onSatelliteChange(satId);
          }
        }
      });
    });

    // 2. Camera Lock Toggle
    const camLockBtn = document.getElementById('btn-cam-lock');
    if (camLockBtn) {
      camLockBtn.addEventListener('click', () => {
        this.cameraLocked = !this.cameraLocked;
        if (this.cameraLocked) {
          audio.playLock();
          this.cameraMode = 'track';
        } else {
          audio.playUnlock();
          this.cameraMode = 'free';
        }
        this._updateCamLockStyles();
        if (this.options.onCameraModeChange) {
          this.options.onCameraModeChange(this.cameraMode, this.cameraLocked);
        }
      });
    }

    // 3. Camera Perspective Buttons
    const povBtns = document.querySelectorAll('.cam-pov-btn');
    povBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        const mode = btn.getAttribute('data-pov');
        this.cameraMode = mode;
        this.cameraLocked = (mode !== 'free' && mode !== 'ground');
        this._updateCamLockStyles();
        this._updatePovButtonStyles(btn);
        if (this.options.onCameraModeChange) {
          this.options.onCameraModeChange(mode, this.cameraLocked);
        }
      });
    });

    // 4. Landmarks Fly-To Dropdown / Buttons
    const landmarkSelect = document.getElementById('select-landmark');
    if (landmarkSelect) {
      landmarkSelect.addEventListener('change', (e) => {
        const landmarkId = e.target.value;
        if (landmarkId) {
          audio.playClick();
          this.cameraLocked = false;
          this._updateCamLockStyles();
          const landmark = LANDMARKS.find(l => l.id === landmarkId);
          if (landmark && this.options.onLandmarkSelect) {
            this.options.onLandmarkSelect(landmark);
          }
          // reset select back to prompt after trigger
          setTimeout(() => { landmarkSelect.value = ''; }, 300);
        }
      });
    }

    // 5. Reset View Button
    const resetBtn = document.getElementById('btn-reset-view');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        audio.playClick();
        this.cameraLocked = false;
        this.cameraMode = 'free';
        this._updateCamLockStyles();
        if (this.options.onResetView) {
          this.options.onResetView();
        }
      });
    }

    // 6. Layer Visibility Toggles
    const toggleBoundariesBtn = document.getElementById('toggle-boundaries-layer');
    if (toggleBoundariesBtn) {
      toggleBoundariesBtn.addEventListener('click', () => {
        audio.playClick();
        this.layers.boundaries = !this.layers.boundaries;
        this._toggleBtnStyle(toggleBoundariesBtn, this.layers.boundaries);
        if (this.options.onLayerToggle) this.options.onLayerToggle('boundaries', this.layers.boundaries);
      });
    }

    const toggleOrbitBtn = document.getElementById('toggle-orbit-layer');
    if (toggleOrbitBtn) {
      toggleOrbitBtn.addEventListener('click', () => {
        audio.playClick();
        this.layers.orbit = !this.layers.orbit;
        this._toggleBtnStyle(toggleOrbitBtn, this.layers.orbit);
        if (this.options.onLayerToggle) this.options.onLayerToggle('orbit', this.layers.orbit);
      });
    }

    const toggleFootprintBtn = document.getElementById('toggle-footprint-layer');
    if (toggleFootprintBtn) {
      toggleFootprintBtn.addEventListener('click', () => {
        audio.playClick();
        this.layers.footprint = !this.layers.footprint;
        this._toggleBtnStyle(toggleFootprintBtn, this.layers.footprint);
        if (this.options.onLayerToggle) this.options.onLayerToggle('footprint', this.layers.footprint);
      });
    }

    const toggleLinkBtn = document.getElementById('toggle-link-layer');
    if (toggleLinkBtn) {
      toggleLinkBtn.addEventListener('click', () => {
        audio.playClick();
        this.layers.groundLink = !this.layers.groundLink;
        this._toggleBtnStyle(toggleLinkBtn, this.layers.groundLink);
        if (this.options.onLayerToggle) this.options.onLayerToggle('groundLink', this.layers.groundLink);
      });
    }

    // New: Earth Observation / Thermal (NASA FIRMS Hotspots) Toggle
    const toggleFirmsBtn = document.getElementById('toggle-firms-layer');
    if (toggleFirmsBtn) {
      toggleFirmsBtn.addEventListener('click', () => {
        audio.playClick();
        this.layers.firms = !this.layers.firms;
        this._toggleFirmsBtnStyle(toggleFirmsBtn, this.layers.firms);
        if (this.options.onLayerToggle) this.options.onLayerToggle('firms', this.layers.firms);
      });
    }

    // New: Optics Mode Cycler (NORMAL -> NVG -> FLIR)
    const btnOptics = document.getElementById('btn-cycle-optics');
    if (btnOptics) {
      btnOptics.addEventListener('click', () => {
        audio.playClick();
        if (this.options.onOpticsCycle) {
          const newMode = this.options.onOpticsCycle();
          this.opticsMode = newMode;
          this._updateOpticsBtnStyle(btnOptics, newMode);
        }
      });
    }

    // 7. Time Multiplier Buttons (1x, 10x, 60x, 300x, Pause)
    const timeBtns = document.querySelectorAll('.time-scale-btn');
    timeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        const scale = parseFloat(btn.getAttribute('data-scale'));
        this.timeScale = scale;
        this.isPaused = (scale === 0);
        this._updateTimeButtonStyles(btn);
        if (this.options.onTimeScaleChange) {
          this.options.onTimeScaleChange(scale, this.isPaused);
        }
      });
    });

    // 8. Audio Mute Toggle
    const audioBtn = document.getElementById('btn-toggle-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = audio.toggleMute();
        audioBtn.textContent = isMuted ? 'AUDIO: OFF' : 'AUDIO: ON';
        audioBtn.className = isMuted
          ? 'px-2.5 py-1 text-xs font-mono rounded bg-slate-800 text-slate-400 border border-slate-700'
          : 'px-2.5 py-1 text-xs font-mono rounded bg-cyan-950 text-cyan-400 border border-cyan-500 shadow-glow-cyan';
      });
    }

    // 9. Telemetry Export
    const exportBtn = document.getElementById('btn-export-telem');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        audio.playClick();
        if (this.options.onExportTelemetry) {
          this.options.onExportTelemetry();
        }
      });
    }

    // 10. Keyboard Shortcut 'H' to toggle entire HUD overlay
    window.addEventListener('keydown', (e) => {
      if (e.key === 'h' || e.key === 'H') {
        // Prevent triggering if typing in an input
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
        this.toggleHudVisibility();
      }
    });

    // HUD toggle button on screen for mobile/mouse users
    const btnToggleHud = document.getElementById('btn-toggle-hud');
    if (btnToggleHud) {
      btnToggleHud.addEventListener('click', () => {
        this.toggleHudVisibility();
      });
    }
  }

  toggleHudVisibility() {
    this.hudVisible = !this.hudVisible;
    audio.playClick();
    const hudContainer = document.getElementById('master-hud-container');
    const hudMiniBar = document.getElementById('hud-minimized-bar');

    if (hudContainer) {
      if (this.hudVisible) {
        hudContainer.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
        hudContainer.classList.add('opacity-100');
        if (hudMiniBar) hudMiniBar.classList.add('hidden');
      } else {
        hudContainer.classList.remove('opacity-100');
        hudContainer.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
        if (hudMiniBar) hudMiniBar.classList.remove('hidden');
      }
    }
  }

  _updateSatButtonStyles() {
    const btns = document.querySelectorAll('.sat-select-btn');
    btns.forEach(btn => {
      const satId = btn.getAttribute('data-sat-id');
      if (satId === this.currentSatId) {
        btn.className = 'sat-select-btn px-3 py-1.5 text-xs font-bold font-mono rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-glow-cyan transition-all';
      } else {
        btn.className = 'sat-select-btn px-3 py-1.5 text-xs font-mono rounded bg-slate-900/60 text-slate-400 border border-slate-700/60 hover:text-slate-200 hover:border-slate-500 transition-all';
      }
    });
  }

  _updateCamLockStyles() {
    const btn = document.getElementById('btn-cam-lock');
    const indicator = document.getElementById('cam-lock-indicator');
    const label = document.getElementById('cam-lock-label');

    if (btn) {
      if (this.cameraLocked) {
        btn.className = 'flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold rounded bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-glow-cyan transition-all';
        if (indicator) indicator.className = 'w-2 h-2 rounded-full bg-cyan-400 animate-ping';
        if (label) label.textContent = 'CAMERA LOCKED [TRACKING]';
      } else {
        btn.className = 'flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded bg-slate-900/80 border border-cyan-500/40 text-cyan-400 hover:border-cyan-400 transition-all';
        if (indicator) indicator.className = 'w-2 h-2 rounded-full bg-cyan-400';
        if (label) label.textContent = 'LOCK CAMERA';
      }
    }
  }

  _updatePovButtonStyles(activeBtn) {
    const btns = document.querySelectorAll('.cam-pov-btn');
    btns.forEach(b => {
      if (b === activeBtn) {
        b.className = 'cam-pov-btn px-2.5 py-1 text-xs font-mono rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400';
      } else {
        b.className = 'cam-pov-btn px-2.5 py-1 text-xs font-mono rounded bg-slate-900/60 text-slate-400 border border-slate-700 hover:text-slate-200';
      }
    });
  }

  _toggleBtnStyle(btn, isActive) {
    if (isActive) {
      btn.className = 'layer-btn px-2.5 py-1 text-xs font-mono rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 shadow-glow-cyan';
    } else {
      btn.className = 'layer-btn px-2.5 py-1 text-xs font-mono rounded bg-slate-900/60 text-slate-500 border border-slate-800 line-through';
    }
  }

  _toggleFirmsBtnStyle(btn, isActive) {
    if (isActive) {
      btn.className = 'layer-btn px-2.5 py-1 text-xs font-mono rounded bg-amber-950/80 text-amber-300 border border-amber-500 shadow-glow-amber font-bold';
    } else {
      btn.className = 'layer-btn px-2.5 py-1 text-xs font-mono rounded bg-slate-900/60 text-slate-500 border border-slate-800';
    }
  }

  _updateOpticsBtnStyle(btn, mode) {
    if (mode === 'NVG') {
      btn.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> OPTICS: NVG`;
      btn.className = 'px-2.5 py-1 text-xs font-mono font-bold rounded bg-emerald-950/90 text-emerald-300 border border-emerald-400 shadow-glow-emerald flex items-center gap-1.5';
    } else if (mode === 'FLIR') {
      btn.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> OPTICS: FLIR`;
      btn.className = 'px-2.5 py-1 text-xs font-mono font-bold rounded bg-amber-950/90 text-amber-300 border border-amber-400 shadow-glow-amber flex items-center gap-1.5';
    } else {
      btn.innerHTML = `OPTICS: NORMAL`;
      btn.className = 'px-2.5 py-1 text-xs font-mono rounded bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500 flex items-center gap-1.5';
    }
  }

  _updateTimeButtonStyles(activeBtn) {
    const btns = document.querySelectorAll('.time-scale-btn');
    btns.forEach(b => {
      if (b === activeBtn) {
        b.className = 'time-scale-btn px-2 py-1 text-xs font-mono font-bold rounded bg-amber-950/80 text-amber-300 border border-amber-400 shadow-glow-amber';
      } else {
        b.className = 'time-scale-btn px-2 py-1 text-xs font-mono rounded bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200';
      }
    });
  }
}
