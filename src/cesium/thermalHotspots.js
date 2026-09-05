/**
 * NASA FIRMS Active Fire & Thermal Hotspots Layer
 * Simulates real-time VIIRS/MODIS thermal anomaly detections across Nigeria
 * for Earth Observation and Disaster Monitoring demonstrations.
 */

import * as Cesium from 'cesium';

// Realistic geographic thermal anomalies across Nigeria (Gas flaring, Biomass burning, Savannah fires)
export const NIGERIA_FIRMS_HOTSPOTS = [
  // Niger Delta Gas Flaring & Energy Corridors
  {
    id: 'firms-nd-01',
    name: 'Bonny Terminal Gas Flare',
    lat: 4.4500,
    lon: 7.1700,
    type: 'GAS_FLARE',
    frpMw: 142.5, // Fire Radiative Power in Megawatts
    brightnessK: 468.2, // Brightness Temperature (Kelvin)
    confidence: 99,
    region: 'Rivers State (Niger Delta Offshore/Coast)',
    satellite: 'NigeriaSat-2 / VIIRS'
  },
  {
    id: 'firms-nd-02',
    name: 'Escravos Flaring Node',
    lat: 5.5800,
    lon: 5.2100,
    type: 'GAS_FLARE',
    frpMw: 118.0,
    brightnessK: 442.8,
    confidence: 98,
    region: 'Delta State (Western Niger Delta)',
    satellite: 'NigeriaSat-X / MODIS'
  },
  {
    id: 'firms-nd-03',
    name: 'Port Harcourt Industrial Cluster',
    lat: 4.7800,
    lon: 7.0200,
    type: 'INDUSTRIAL_THERMAL',
    frpMw: 88.4,
    brightnessK: 412.5,
    confidence: 94,
    region: 'Rivers State Industrial Zone',
    satellite: 'NigeriaSat-2'
  },
  {
    id: 'firms-nd-04',
    name: 'Oguta Lake Hydrocarbon Thermal Point',
    lat: 5.7100,
    lon: 6.8100,
    type: 'GAS_FLARE',
    frpMw: 95.2,
    brightnessK: 425.0,
    confidence: 96,
    region: 'Imo River Basin',
    satellite: 'NigeriaSat-2'
  },

  // Middle Belt & Savannah Agricultural / Bushfire Anomalies
  {
    id: 'firms-mb-01',
    name: 'Benue River Basin Agricultural Burn',
    lat: 7.7300,
    lon: 8.5200,
    type: 'SAVANNAH_FIRE',
    frpMw: 45.6,
    brightnessK: 358.4,
    confidence: 89,
    region: 'Benue Valley Agro-Ecological Corridor',
    satellite: 'NigeriaSat-2'
  },
  {
    id: 'firms-mb-02',
    name: 'Kafanchan-Jos Southern Plateau Fire',
    lat: 9.5800,
    lon: 8.3000,
    type: 'BUSHFIRE',
    frpMw: 62.0,
    brightnessK: 374.1,
    confidence: 91,
    region: 'Kaduna / Plateau Border Transition',
    satellite: 'NigeriaSat-X'
  },
  {
    id: 'firms-mb-03',
    name: 'Niger River Floodplain Thermal Anomaly',
    lat: 9.0800,
    lon: 6.0100,
    type: 'AGRICULTURAL_RESIDUE',
    frpMw: 38.2,
    brightnessK: 349.5,
    confidence: 86,
    region: 'Niger State Lowlands',
    satellite: 'NigeriaSat-2'
  },

  // North-East / Chad Basin Anomalies
  {
    id: 'firms-ne-01',
    name: 'Lake Chad Wetlands Thermal Anomaly',
    lat: 12.8500,
    lon: 13.9000,
    type: 'WETLAND_BURN',
    frpMw: 54.0,
    brightnessK: 366.8,
    confidence: 92,
    region: 'Borno State (Lake Chad Basin)',
    satellite: 'NigeriaSat-X'
  },
  {
    id: 'firms-ne-02',
    name: 'Sambisa Reserve Scrub Fire',
    lat: 11.2500,
    lon: 13.5000,
    type: 'WILDFIRE',
    frpMw: 78.5,
    brightnessK: 395.0,
    confidence: 95,
    region: 'Borno Central Scrubland',
    satellite: 'NigeriaSat-2'
  },

  // South-West / Forestry Perimeters
  {
    id: 'firms-sw-01',
    name: 'Omo Forest Reserve Flank',
    lat: 6.8500,
    lon: 4.3500,
    type: 'FOREST_CLEARING',
    frpMw: 32.4,
    brightnessK: 342.1,
    confidence: 84,
    region: 'Ogun State Forest Margin',
    satellite: 'NigeriaSat-X'
  }
];

export class ThermalHotspotsManager {
  /**
   * @param {Cesium.Viewer} viewer 
   * @param {Object} options
   * @param {Function} options.onSelectHotspot
   * @param {Function} options.onDeselectHotspot
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.options = options;
    this.onSelectHotspot = options.onSelectHotspot || null;
    this.onDeselectHotspot = options.onDeselectHotspot || null;
    this.entities = [];
    this.visible = false; // toggled via HUD
    this.selectedHotspot = null;
    this.reticleEntity = null;
    this.handler = null;

    this.initHotspots();
    this.initPickingHandler();
  }

  _generateFireSvg() {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="#ef4444" fill-opacity="0.3" />
        <circle cx="18" cy="18" r="10" fill="#f97316" fill-opacity="0.5" />
        <path d="M18 6 C18 10, 13 14, 13 19 C13 22, 15 25, 18 25 C21 25, 23 22, 23 19 C23 15, 20 12, 18 6 Z" fill="#facc15" />
        <path d="M18 13 C18 16, 15 18, 15 21 C15 23, 16 24, 18 24 C20 24, 21 23, 21 21 C21 18, 19 17, 18 13 Z" fill="#ffffff" />
      </svg>
    `;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  initHotspots() {
    const fireIcon = this._generateFireSvg();

    NIGERIA_FIRMS_HOTSPOTS.forEach(spot => {
      const position = Cesium.Cartesian3.fromDegrees(spot.lon, spot.lat, 100);

      // 1. Hotspot Marker Billboard & Point
      const marker = this.viewer.entities.add({
        name: `NASA FIRMS: ${spot.name}`,
        show: this.visible,
        position: position,
        billboard: {
          image: fireIcon,
          scale: 0.9,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: `[FIRMS] ${spot.name} (${spot.frpMw} MW)`,
          font: '10px "Share Tech Mono", monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.fromCssColorString('#facc15'),
          outlineColor: Cesium.Color.fromCssColorString('#030712'),
          outlineWidth: 3,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(500.0, 1.5e6),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        description: `
          <div style="font-family: monospace; color: #fff; padding: 4px;">
            <b>Thermal Anomaly:</b> ${spot.name}<br/>
            <b>Classification:</b> ${spot.type}<br/>
            <b>Fire Radiative Power:</b> ${spot.frpMw} MW<br/>
            <b>Brightness Temp:</b> ${spot.brightnessK} K<br/>
            <b>Confidence:</b> ${spot.confidence}%<br/>
            <b>Detecting Platform:</b> ${spot.satellite}<br/>
            <b>Region:</b> ${spot.region}
          </div>
        `
      });
      // Attach hotspot data for click detection
      marker.firmsData = spot;

      // 2. Radiating Thermal Ground Anomaly Circle
      const radiusMeters = spot.frpMw > 100 ? 12000 : 7000;
      const ring = this.viewer.entities.add({
        show: this.visible,
        position: position,
        ellipse: {
          semiMinorAxis: radiusMeters,
          semiMajorAxis: radiusMeters,
          material: new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.2)),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#f97316').withAlpha(0.65),
          outlineWidth: 1.5,
          height: 50.0
        }
      });
      ring.firmsData = spot;

      this.entities.push(marker, ring);
    });
  }

  initPickingHandler() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.handler.setInputAction((movement) => {
      if (!this.visible) return;

      const pickedObject = this.viewer.scene.pick(movement.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.firmsData) {
        this.selectHotspot(pickedObject.id.firmsData);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  /**
   * Fly to hotspot at state level (280 km) centered and render pulsing reticle ring
   */
  selectHotspot(spot) {
    if (!spot) return;
    this.selectedHotspot = spot;

    // Smoothly fly camera over the hotspot at State-Level altitude (~280,000m / 280 km) with point centered
    const center = Cesium.Cartesian3.fromDegrees(spot.lon, spot.lat, 0);
    const sphere = new Cesium.BoundingSphere(center, 10.0);
    this.viewer.camera.flyToBoundingSphere(sphere, {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0.0),
        Cesium.Math.toRadians(-80.0),
        280000.0 // 280 km
      ),
      duration: 2.0,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });

    // Render pulsing circular reticle/ring around the selected hotspot
    if (this.reticleEntity) {
      this.viewer.entities.remove(this.reticleEntity);
      this.reticleEntity = null;
    }

    const pulseStart = performance.now();
    this.reticleEntity = this.viewer.entities.add({
      name: `Target Reticle: ${spot.name}`,
      position: Cesium.Cartesian3.fromDegrees(spot.lon, spot.lat, 100),
      ellipse: {
        semiMinorAxis: new Cesium.CallbackProperty(() => {
          const t = ((performance.now() - pulseStart) % 1800) / 1800;
          return 8000 + t * 16000;
        }, false),
        semiMajorAxis: new Cesium.CallbackProperty(() => {
          const t = ((performance.now() - pulseStart) % 1800) / 1800;
          return 8000 + t * 16000;
        }, false),
        material: new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(() => {
            const t = ((performance.now() - pulseStart) % 1800) / 1800;
            return Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.65 * (1 - t) + 0.1);
          }, false)
        ),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#facc15'),
        outlineWidth: 2.0,
        height: 100.0
      }
    });

    if (this.onSelectHotspot) {
      this.onSelectHotspot(spot);
    }
  }

  unselectHotspot() {
    this.selectedHotspot = null;
    if (this.reticleEntity) {
      this.viewer.entities.remove(this.reticleEntity);
      this.reticleEntity = null;
    }
    if (this.onDeselectHotspot) {
      this.onDeselectHotspot();
    }
  }

  setVisible(visible) {
    this.visible = visible;
    this.entities.forEach(ent => {
      ent.show = visible;
    });
    if (!visible && this.reticleEntity) {
      this.unselectHotspot();
    }
  }

  toggle() {
    this.setVisible(!this.visible);
    return this.visible;
  }

  destroy() {
    if (this.handler && !this.handler.isDestroyed()) {
      this.handler.destroy();
      this.handler = null;
    }
    if (this.reticleEntity) {
      this.viewer.entities.remove(this.reticleEntity);
      this.reticleEntity = null;
    }
    this.entities.forEach(ent => {
      this.viewer.entities.remove(ent);
    });
    this.entities = [];
  }
}

