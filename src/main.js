/**
 * NASRDA SAT-OPS // Main Application Orchestrator
 * Connects CesiumJS, Satellite.js SGP4 physics, TLE fetching, Polar Radar,
 * Zoom Slider, Thermal/FIRMS sensor layers, Optics modes, and Tactical HUD.
 */

import './style.css';
import { SATELLITE_CATALOG, DEFAULT_SATELLITE_ID, GROUND_STATIONS } from './config/satellites.js';
import { TleService } from './services/tleService.js';
import { OrbitalPhysics } from './math/orbitalPhysics.js';
import { GlobeManager } from './cesium/globeManager.js';
import { SatelliteEntity } from './cesium/satelliteEntity.js';
import { OrbitVisualizer } from './cesium/orbitVisualizer.js';
import { FootprintCone } from './cesium/footprintCone.js';
import { GroundStationVisualizer } from './cesium/groundStation.js';
import { ThermalHotspotsManager } from './cesium/thermalHotspots.js';
import { OpticsManager } from './cesium/opticsManager.js';
import { BoundariesManager } from './cesium/boundariesManager.js';
import { FacilityBeaconsManager } from './cesium/facilityBeacons.js';
import { RadarScope } from './hud/radarScope.js';
import { HudController } from './hud/hudController.js';
import { ControlsManager } from './hud/controls.js';
import { ZoomSlider } from './hud/zoomSlider.js';

class SatOpsApplication {
  constructor() {
    this.currentSatConfig = SATELLITE_CATALOG.find(s => s.id === DEFAULT_SATELLITE_ID) || SATELLITE_CATALOG[0];
    this.tleInfo = null;
    this.satrec = null;
    this.passInfo = null;
    this.latestTelemetry = null;

    // Simulation time & warp engine management
    this.simulatedTime = new Date();
    this.lastRealTime = performance.now();
    this.lastPassCalcTime = 0;
    this.timeScale = 1;
    this.isPaused = false;

    // Core Managers
    this.globeManager = null;
    this.satelliteEntity = null;
    this.orbitVisualizer = null;
    this.footprintCone = null;
    this.groundStation = null;
    this.thermalHotspots = null;
    this.opticsManager = null;
    this.radarScope = null;
    this.hudController = null;
    this.controlsManager = null;
    this.zoomSlider = null;

    this.init();
  }

  async init() {
    console.log('[SatOps] Initializing NASRDA Satellite Operations Center...');

    // 1. Initialize Cesium Globe with smooth progressive zoom
    this.globeManager = new GlobeManager('cesiumContainer');

    // 2. Initialize Tactical Vertical Zoom Slider
    this.zoomSlider = new ZoomSlider({ globeManager: this.globeManager });

    // 3. Initialize Optics (NORMAL, NVG, FLIR) & NASA FIRMS Thermal Sensor Layer
    this.opticsManager = new OpticsManager(this.globeManager.viewer);
    this.thermalHotspots = new ThermalHotspotsManager(this.globeManager.viewer);

    // 4. Initialize Boundaries & Facility Beacons
    this.boundariesManager = new BoundariesManager(this.globeManager.viewer);
    this.facilityBeacons = new FacilityBeaconsManager(this.globeManager.viewer);

    // 5. Initialize HUD Controller & 2D Polar Sky Radar
    this.hudController = new HudController();
    const radarCanvas = document.getElementById('radarCanvas');
    if (radarCanvas) {
      this.radarScope = new RadarScope(radarCanvas);
    }

    // 6. Initialize Ground Station Visualizer at Abuja TT&C (8.99° N, 7.39° E)
    this.groundStation = new GroundStationVisualizer(this.globeManager.viewer, GROUND_STATIONS.abuja);

    // 7. Initialize Orbit Trajectory Visualizer
    this.orbitVisualizer = new OrbitVisualizer(this.globeManager.viewer);

    // 7. Initialize Interactive Controls & Keyboard shortcuts
    this.controlsManager = new ControlsManager({
      onSatelliteChange: (satId) => this.switchSatellite(satId),
      onCameraModeChange: (mode, locked) => this.handleCameraModeChange(mode, locked),
      onLandmarkSelect: (landmark) => this.globeManager.flyToLandmark(landmark),
      onResetView: () => this.globeManager.resetCameraToNigeria(),
      onLayerToggle: (layer, visible) => this.handleLayerToggle(layer, visible),
      onOpticsCycle: () => this.opticsManager.cycle(),
      onTimeScaleChange: (scale, isPaused) => {
        this.timeScale = scale;
        this.isPaused = isPaused;
      },
      onExportTelemetry: () => this.exportTelemetryData()
    });

    // Wire up the minimized HUD restore button
    const btnRestore = document.getElementById('btn-toggle-hud-restore');
    if (btnRestore) {
      btnRestore.addEventListener('click', () => {
        if (this.controlsManager) this.controlsManager.toggleHudVisibility();
      });
    }

    // 8. Load Initial Satellite (NigComSat-1R)
    await this.loadSatellite(this.currentSatConfig);

    // 9. Start 60 FPS Render & Physics Simulation Loop
    this.startSimulationLoop();

    console.log('[SatOps] Production Operations Center Active.');
  }

  /**
   * Load satellite TLE, initialize 3D entities, and calculate orbit trail
   */
  async loadSatellite(satConfig) {
    this.currentSatConfig = satConfig;

    // Clean up previous entities
    if (this.satelliteEntity) {
      this.satelliteEntity.destroy();
      this.satelliteEntity = null;
    }
    if (this.footprintCone) {
      this.footprintCone.destroy();
      this.footprintCone = null;
    }
    this.orbitVisualizer.clear();

    // Fetch TLE (Live CelesTrak or Verified Fallback Catalog)
    this.tleInfo = await TleService.getTle(satConfig);
    this.satrec = OrbitalPhysics.parseTle(this.tleInfo.line1, this.tleInfo.line2);

    if (!this.satrec) {
      console.error(`[SatOps] Failed to parse TLE for ${satConfig.name}`);
      return;
    }

    // Initialize 3D Satellite Entity & Footprint Cone
    this.satelliteEntity = new SatelliteEntity(this.globeManager.viewer, satConfig);
    this.footprintCone = new FootprintCone(this.globeManager.viewer, satConfig);

    // Generate 3D Orbit Path Polyline & Ground Tracks
    const orbitPoints = OrbitalPhysics.generateOrbitPath(this.satrec, this.simulatedTime, satConfig);
    this.orbitVisualizer.updateOrbitPath(orbitPoints, satConfig);

    // Compute Next Pass Window for Abuja Ground Station
    this.passInfo = OrbitalPhysics.findNextPass(this.satrec, this.simulatedTime, GROUND_STATIONS.abuja, satConfig);
    this.lastPassCalcTime = this.simulatedTime.getTime();

    // Initial Telemetry Step
    this.updateTelemetryStep(this.simulatedTime);

    // If camera was locked, update tracked entity
    if (this.controlsManager.cameraLocked) {
      this.globeManager.setCameraMode(this.controlsManager.cameraMode, this.satelliteEntity.entity, GROUND_STATIONS.abuja);
    }
  }

  /**
   * Switch active satellite smoothly
   */
  async switchSatellite(satId) {
    const config = SATELLITE_CATALOG.find(s => s.id === satId);
    if (config) {
      console.log(`[SatOps] Switching tracking target to ${config.name} (${config.type})...`);
      await this.loadSatellite(config);
    }
  }

  /**
   * Camera mode handler
   */
  handleCameraModeChange(mode, locked) {
    const satEnt = this.satelliteEntity ? this.satelliteEntity.entity : null;
    this.globeManager.setCameraMode(mode, satEnt, GROUND_STATIONS.abuja);
  }

  /**
   * Layer visibility handler
   */
  handleLayerToggle(layer, visible) {
    if (layer === 'orbit' && this.orbitVisualizer) {
      this.orbitVisualizer.setVisible(visible);
    } else if (layer === 'footprint' && this.footprintCone) {
      this.footprintCone.setVisible(visible);
    } else if (layer === 'groundLink' && this.groundStation) {
      this.groundStation.setVisible(visible);
    } else if (layer === 'firms' && this.thermalHotspots) {
      this.thermalHotspots.setVisible(visible);
    } else if (layer === 'boundaries' && this.boundariesManager) {
      this.boundariesManager.setVisible(visible);
    }
  }

  /**
   * Core frame step computation
   */
  updateTelemetryStep(currentTime) {
    if (!this.satrec) return;

    // Propagate physics with satellite.js + GEO locking
    const telem = OrbitalPhysics.calculateTelemetry(this.satrec, currentTime, GROUND_STATIONS.abuja, this.currentSatConfig);
    if (!telem) return;

    this.latestTelemetry = telem;

    // Periodically refresh pass prediction for LEO satellites (every 10s of simulated time)
    if (this.currentSatConfig.type === 'LEO') {
      const timeSincePassCalc = Math.abs(currentTime.getTime() - this.lastPassCalcTime);
      if (timeSincePassCalc > 10000) {
        this.passInfo = OrbitalPhysics.findNextPass(this.satrec, currentTime, GROUND_STATIONS.abuja, this.currentSatConfig);
        this.lastPassCalcTime = currentTime.getTime();
      }
    }

    // Update 3D Cesium entities
    if (this.satelliteEntity) {
      this.satelliteEntity.updatePosition(telem);
    }
    if (this.footprintCone) {
      this.footprintCone.update(telem);
    }
    if (this.groundStation) {
      this.groundStation.updateLink(telem);
    }

    // Update 2D Sky Radar
    if (this.radarScope) {
      this.radarScope.updateTarget(telem.lookAngles, this.currentSatConfig.name);
    }

    // Update HUD DOM with live Realtime UTC and Simulation Epoch
    if (this.hudController) {
      this.hudController.update(telem, this.currentSatConfig, this.tleInfo, this.passInfo, currentTime);
    }
  }

  /**
   * 60 FPS requestAnimationFrame loop
   */
  startSimulationLoop() {
    const loop = (currentRealTime) => {
      const deltaRealSec = (currentRealTime - this.lastRealTime) / 1000;
      this.lastRealTime = currentRealTime;

      // Advance simulated clock according to warp rate
      if (!this.isPaused && deltaRealSec > 0 && deltaRealSec < 1.0) {
        const simDeltaMs = deltaRealSec * 1000 * this.timeScale;
        this.simulatedTime = new Date(this.simulatedTime.getTime() + simDeltaMs);
      }

      // Compute frame updates
      this.updateTelemetryStep(this.simulatedTime);

      // Render 2D Radar Canvas
      if (this.radarScope) {
        this.radarScope.render();
      }

      // Update vertical zoom slider thumb position
      if (this.zoomSlider) {
        this.zoomSlider.update();
      }

      requestAnimationFrame(loop);
    };

    this.lastRealTime = performance.now();
    requestAnimationFrame(loop);
  }

  /**
   * Export telemetry state as JSON / CSV
   */
  exportTelemetryData() {
    if (!this.latestTelemetry) return;

    const data = {
      satellite: this.currentSatConfig.name,
      noradId: this.currentSatConfig.noradId,
      designation: this.currentSatConfig.designation,
      realtimeUtc: new Date().toISOString(),
      simulationEpoch: this.simulatedTime.toISOString(),
      timeScale: this.timeScale,
      tle: this.tleInfo,
      telemetry: this.latestTelemetry,
      groundStation: GROUND_STATIONS.abuja
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NASRDA_${this.currentSatConfig.id}_telemetry_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Boot application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new SatOpsApplication();
});
