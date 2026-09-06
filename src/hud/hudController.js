/**
 * Tactical HUD Controller
 * Updates all DOM HUD telemetry metrics, clocks, gauges, and status badges.
 */

export class HudController {
  constructor() {
    this.startTime = Date.now();
    this.fpsCount = 0;
    this.lastFpsTime = performance.now();
    this.currentFps = 60;
    this.perturbationDismissed = false;

    const btnClosePerturbation = document.getElementById('btn-close-perturbation');
    if (btnClosePerturbation) {
      btnClosePerturbation.addEventListener('click', () => {
        this.perturbationDismissed = true;
        const badge = document.getElementById('hud-perturbation-badge');
        if (badge) badge.classList.add('hidden');
      });
    }
  }

  /**
   * Update all real-time telemetry in HUD
   * @param {Object} telemetry Telemetry data from OrbitalPhysics
   * @param {Object} satConfig Current satellite config
   * @param {Object} tleInfo TLE metadata
   * @param {Object} passInfo Next pass info
   * @param {Date} simulatedDate Active simulation time
   */
  update(telemetry, satConfig, tleInfo, passInfo, simulatedDate = new Date()) {
    if (!telemetry) return;

    this._updateClocks(simulatedDate);
    this._updateTelemetryReadouts(telemetry);
    this._updateKeplerianElements(telemetry.keplerian);
    this._updateGroundStationLink(telemetry.lookAngles);
    this._updatePassPredictor(passInfo, simulatedDate);
    this._updateSatelliteOverview(satConfig, tleInfo);
    this._updateFps();
    this.checkPerturbationNotice(simulatedDate);
  }

  _formatWat(date) {
    // Nigerian Local Time is West Africa Time (WAT = UTC+1)
    const watTime = new Date(date.getTime() + 3600000);
    const iso = watTime.toISOString();
    return `${iso.substring(0, 10)} ${iso.substring(11, 19)}`;
  }

  _updateClocks(simulatedDate) {
    const realNow = new Date();

    // 1. REALTIME (WAT & UTC)
    const realtimeWatEl = document.getElementById('hud-realtime-wat');
    const realtimeUtcEl = document.getElementById('hud-realtime-utc');
    if (realtimeWatEl) {
      realtimeWatEl.textContent = this._formatWat(realNow);
    }
    if (realtimeUtcEl) {
      realtimeUtcEl.textContent = `(${realNow.toISOString().substring(11, 19)} UTC)`;
    }

    // 2. SIMULATION EPOCH (Desktop & Mobile)
    const simWatEl = document.getElementById('hud-sim-wat');
    const simEpochEl = document.getElementById('hud-sim-epoch');
    const simEpochMobileEl = document.getElementById('hud-sim-epoch-mobile');

    if (simWatEl) {
      simWatEl.textContent = this._formatWat(simulatedDate);
    }
    if (simEpochEl) {
      simEpochEl.textContent = `(${simulatedDate.toISOString().substring(11, 19)} UTC)`;
    }
    if (simEpochMobileEl) {
      simEpochMobileEl.textContent = `${this._formatWat(simulatedDate).substring(11, 19)} WAT`;
    }

    // Mission Elapsed Time / Session Time
    const metEl = document.getElementById('hud-met-time');
    if (metEl) {
      const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
      const hrs = String(Math.floor(elapsedSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0');
      const secs = String(elapsedSec % 60).padStart(2, '0');
      metEl.textContent = `T+${hrs}:${mins}:${secs}`;
    }
  }

  _updateTelemetryReadouts(telemetry) {
    const { lat, lon, alt, ecf } = telemetry.position;
    const { scalar, vx, vy, vz } = telemetry.velocity;

    // Lat / Lon
    const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
    const lonStr = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;

    this._setText('telem-lat', latStr);
    this._setText('telem-lon', lonStr);
    this._setText('telem-alt', `${Math.round(alt).toLocaleString()} km`);
    this._setText('telem-vel', `${scalar.toFixed(3)} km/s`);

    // Velocity Vector
    this._setText('telem-vx', `${vx >= 0 ? '+' : ''}${vx.toFixed(2)}`);
    this._setText('telem-vy', `${vy >= 0 ? '+' : ''}${vy.toFixed(2)}`);
    this._setText('telem-vz', `${vz >= 0 ? '+' : ''}${vz.toFixed(2)}`);

    // ECF Position
    this._setText('telem-ecf-x', `${ecf.x >= 0 ? '+' : ''}${Math.round(ecf.x).toLocaleString()}`);
    this._setText('telem-ecf-y', `${ecf.y >= 0 ? '+' : ''}${Math.round(ecf.y).toLocaleString()}`);
    this._setText('telem-ecf-z', `${ecf.z >= 0 ? '+' : ''}${Math.round(ecf.z).toLocaleString()}`);
  }

  _updateKeplerianElements(kep) {
    if (!kep) return;
    this._setText('kep-inc', `${kep.inclination.toFixed(3)}°`);
    this._setText('kep-raan', `${kep.raan.toFixed(3)}°`);
    this._setText('kep-ecc', kep.eccentricity.toFixed(6));
    this._setText('kep-argp', `${kep.argPerigee.toFixed(3)}°`);
    this._setText('kep-ma', `${kep.meanAnomaly.toFixed(3)}°`);
    this._setText('kep-period', `${kep.periodMinutes.toFixed(1)} min`);
    this._setText('kep-apogee', `${Math.round(kep.apogeeKm).toLocaleString()} km`);
    this._setText('kep-perigee', `${Math.round(kep.perigeeKm).toLocaleString()} km`);
    this._setText('kep-sma', `${Math.round(kep.semiMajorAxisKm).toLocaleString()} km`);
  }

  _updateGroundStationLink(look) {
    if (!look) return;

    this._setText('gs-azimuth', `${look.azimuth.toFixed(2)}°`);
    this._setText('gs-elevation', `${look.elevation >= 0 ? '+' : ''}${look.elevation.toFixed(2)}°`);
    this._setText('gs-range', `${Math.round(look.range).toLocaleString()} km`);
    this._setText('gs-range-rate', `${look.rangeRate >= 0 ? '+' : ''}${look.rangeRate.toFixed(2)} km/s`);
    this._setText('gs-doppler', `${look.dopplerKhz >= 0 ? '+' : ''}${look.dopplerKhz.toFixed(2)} kHz`);
    this._setText('gs-signal', `${look.signalDbm} dBm`);

    // Link Status Badge: "RF LINK ACTIVE / LOCKED" with green/cyan indicator
    const statusBadge = document.getElementById('gs-link-badge');
    const linkIcon = document.getElementById('gs-link-indicator');
    const signalBar = document.getElementById('gs-signal-bar');

    if (look.isAcquired) {
      if (statusBadge) {
        statusBadge.textContent = 'RF LINK ACTIVE / LOCKED';
        statusBadge.className = 'px-2 py-0.5 text-xs font-bold rounded bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-glow-cyan animate-pulse';
      }
      if (linkIcon) linkIcon.className = 'w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-glow-cyan';
      if (signalBar) {
        signalBar.style.width = `${Math.max(20, Math.min(100, (130 + look.signalDbm) * 1.5))}%`;
        signalBar.className = 'h-full bg-cyan-400 shadow-glow-cyan transition-all duration-300';
      }
    } else if (look.hasLos) {
      if (statusBadge) {
        statusBadge.textContent = 'MARGINAL HORIZON LINK';
        statusBadge.className = 'px-2 py-0.5 text-xs font-bold rounded bg-amber-950/80 border border-amber-500 text-amber-400';
      }
      if (linkIcon) linkIcon.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 shadow-glow-amber';
      if (signalBar) {
        signalBar.style.width = '35%';
        signalBar.className = 'h-full bg-amber-400 transition-all duration-300';
      }
    } else {
      if (statusBadge) {
        statusBadge.textContent = 'OCCULTED (BELOW HORIZON)';
        statusBadge.className = 'px-2 py-0.5 text-xs font-bold rounded bg-rose-950/80 border border-rose-500 text-rose-400';
      }
      if (linkIcon) linkIcon.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 shadow-glow-crimson';
      if (signalBar) {
        signalBar.style.width = '5%';
        signalBar.className = 'h-full bg-rose-500 transition-all duration-300';
      }
    }
  }

  _updatePassPredictor(passInfo, simulatedDate) {
    if (!passInfo) return;

    const passStatusEl = document.getElementById('pass-status-text');
    const passCountdownEl = document.getElementById('pass-countdown-text');
    const passMaxEl = document.getElementById('pass-max-el');
    const passDurationEl = document.getElementById('pass-duration');

    if (passInfo.isPermanent) {
      if (passStatusEl) passStatusEl.textContent = 'PERMANENT GEO VISIBILITY';
      if (passCountdownEl) passCountdownEl.textContent = '24/7 ACTIVE CONTACT';
      if (passMaxEl) passMaxEl.textContent = `STEADY +${passInfo.maxElevation.toFixed(1)}°`;
      if (passDurationEl) passDurationEl.textContent = 'CONTINUOUS';
      return;
    }

    if (passStatusEl) passStatusEl.textContent = passInfo.status;
    if (passMaxEl) passMaxEl.textContent = `${passInfo.maxElevation >= 0 ? '+' : ''}${passInfo.maxElevation.toFixed(1)}°`;
    if (passDurationEl) passDurationEl.textContent = `${passInfo.durationMinutes} min`;

    if (passCountdownEl) {
      if (passInfo.aosTime) {
        const diffMs = passInfo.aosTime.getTime() - simulatedDate.getTime();
        if (diffMs > 0) {
          const diffMins = Math.floor(diffMs / 60000);
          const diffSecs = Math.floor((diffMs % 60000) / 1000);
          passCountdownEl.textContent = `AOS IN: ${diffMins}m ${diffSecs}s`;
        } else if (passInfo.losTime) {
          const losDiffMs = passInfo.losTime.getTime() - simulatedDate.getTime();
          if (losDiffMs > 0) {
            const losMins = Math.floor(losDiffMs / 60000);
            const losSecs = Math.floor((losDiffMs % 60000) / 1000);
            passCountdownEl.textContent = `IN PASS: ${losMins}m ${losSecs}s REMAINING`;
          } else {
            passCountdownEl.textContent = 'PASS COMPLETED';
          }
        }
      } else {
        passCountdownEl.textContent = 'CALCULATING NEXT AOS...';
      }
    }
  }

  _updateSatelliteOverview(satConfig, tleInfo) {
    if (!satConfig) return;

    this._setText('sat-name-banner', satConfig.name);
    this._setText('sat-norad-banner', `NORAD: ${satConfig.noradId}`);
    this._setText('sat-type-banner', satConfig.orbitClass);
    this._setText('sat-payload-desc', satConfig.payload);
    this._setText('sat-operator', satConfig.operator);
    this._setText('sat-launch-date', satConfig.launchDate);
    this._setText('sat-coverage', satConfig.coverageArea);

    if (tleInfo) {
      this._setText('tle-source-badge', tleInfo.source || 'CelesTrak GP');
    }
  }

  _updateFps() {
    this.fpsCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.currentFps = Math.round((this.fpsCount * 1000) / (now - this.lastFpsTime));
      this.fpsCount = 0;
      this.lastFpsTime = now;
      this._setText('hud-fps', `${this.currentFps} FPS`);
    }
  }

  _setText(elementId, text) {
    const el = document.getElementById(elementId);
    if (el && el.textContent !== text) {
      el.textContent = text;
    }
  }

  showTrackingBanner(targetName) {
    const banner = document.getElementById('hud-tracking-banner');
    const title = document.getElementById('hud-tracking-title');
    if (banner && title) {
      title.textContent = `TRACKING: ${targetName.toUpperCase()}`;
      banner.classList.remove('hidden');
    }
  }

  hideTrackingBanner() {
    const banner = document.getElementById('hud-tracking-banner');
    if (banner) {
      banner.classList.add('hidden');
    }
  }

  showHotspotModal(spot) {
    const modal = document.getElementById('hud-hotspot-modal');
    if (!modal || !spot) return;

    this.selectedHotspot = spot;
    this._setText('hotspot-name', spot.name);
    this._setText('hotspot-region', spot.region);
    this._setText('hotspot-coords', `${spot.lat.toFixed(4)}°N, ${spot.lon.toFixed(4)}°E`);
    this._setText('hotspot-sensor', spot.satellite);
    this._setText('hotspot-frp', `${spot.frpMw.toFixed(1)} MW`);
    this._setText('hotspot-confidence', `${spot.brightnessK.toFixed(1)} K / ${spot.confidence}%`);

    modal.classList.remove('hidden');
  }

  showFacilityModal(fac) {
    const modal = document.getElementById('hud-facility-modal');
    if (!modal || !fac) return;

    this.selectedFacility = fac;
    this._setText('facility-name', fac.name || fac.shortName);
    this._setText('facility-callsign', fac.callsign || fac.id.toUpperCase());
    this._setText('facility-role', fac.role || 'Strategic Space Asset');
    const elev = fac.elevationM ? ` (${fac.elevationM}m ASL)` : '';
    this._setText('facility-coords', `${fac.lat.toFixed(4)}°N, ${fac.lon.toFixed(4)}°E${elev}`);
    this._setText('facility-details', fac.mandate || fac.role || '--');

    modal.classList.remove('hidden');
  }

  hideFacilityModal() {
    this.selectedFacility = null;
    const modal = document.getElementById('hud-facility-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  hideHotspotModal() {
    this.selectedHotspot = null;
    const modal = document.getElementById('hud-hotspot-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  checkPerturbationNotice(simulatedDate) {
    const badge = document.getElementById('hud-perturbation-badge');
    if (!badge || this.perturbationDismissed) return;

    const realNow = new Date();
    const diffDays = Math.abs(simulatedDate.getTime() - realNow.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  /**
   * Render or refresh AI intelligence stream cards in the drawer
   * @param {Array} alerts Array of synthesized tactical alerts
   * @param {Function} onGlideIncident Callback with (coordinates) when user clicks Glide & Reticle
   */
  updateIntelStream(alerts, onGlideIncident) {
    const container = document.getElementById('intel-alerts-list');
    if (!container || !alerts) return;

    this.updateIntelBadge(alerts.length);

    // Keep active list populated
    container.innerHTML = '';

    alerts.forEach((alert) => {
      const card = document.createElement('div');
      card.className = 'hud-glass-panel rounded-lg p-2.5 border border-slate-700/80 bg-slate-950/80 hover:border-emerald-500/60 transition-all text-xs font-mono relative';

      const typeColor = alert.severity === 'critical' ? 'text-red-400' :
                        alert.severity === 'tasking' ? 'text-cyan-400' :
                        alert.severity === 'info' ? 'text-amber-400' : 'text-emerald-400';

      card.innerHTML = `
        <div class="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-slate-800">
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full ${alert.severity === 'critical' ? 'bg-red-400 animate-ping' : 'bg-emerald-400 animate-pulse'}"></span>
            <span class="text-[10px] font-bold ${typeColor} uppercase">[${alert.type}]</span>
          </div>
          <span class="text-[9px] px-1.5 py-0.2 rounded font-bold border ${alert.badgeColor}">${alert.badge}</span>
        </div>

        <div class="text-xs font-bold text-slate-100 mb-1 leading-tight">${alert.title}</div>
        <p class="text-[10px] text-slate-300 font-sans leading-relaxed mb-2">${alert.message}</p>

        <div class="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-[9px] space-y-0.5 mb-2">
          <div class="flex justify-between text-slate-400">
            <span>TARGET ZONE:</span>
            <span class="text-slate-200 font-bold truncate max-w-[200px]">${alert.location}</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>COORDINATES:</span>
            <span class="text-cyan-300 font-bold">${alert.coordinates.lat.toFixed(2)}°N, ${alert.coordinates.lon.toFixed(2)}°E</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>CORRELATED SENSOR:</span>
            <span class="text-slate-300">${alert.sensor}</span>
          </div>
          <div class="flex justify-between text-slate-500 pt-0.5 border-t border-slate-800">
            <span>EPOCH (WAT):</span>
            <span class="text-emerald-400">${alert.timestampWat}</span>
          </div>
        </div>

        <div class="flex items-center justify-end">
          <button class="btn-glide-reticle px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 hover:bg-emerald-900 shadow-glow-emerald transition-all active:scale-95 flex items-center gap-1 cursor-pointer">
            <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <span>[GLIDE & RETICLE]</span>
          </button>
        </div>
      `;

      const btnGlide = card.querySelector('.btn-glide-reticle');
      if (btnGlide) {
        btnGlide.addEventListener('click', () => {
          if (onGlideIncident) {
            onGlideIncident(alert.coordinates);
          }
        });
      }

      container.appendChild(card);
    });
  }

  updateIntelBadge(count) {
    const badgeDesktop = document.getElementById('intel-badge-count');
    const badgeMobile = document.getElementById('intel-badge-count-mobile');
    if (badgeDesktop) {
      badgeDesktop.textContent = count;
      badgeDesktop.style.display = count > 0 ? 'inline-block' : 'none';
    }
    if (badgeMobile) {
      badgeMobile.textContent = count;
      badgeMobile.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }
}
