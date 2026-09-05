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
   */
  constructor(viewer) {
    this.viewer = viewer;
    this.entities = [];
    this.visible = false; // toggled via HUD
    this.initHotspots();
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
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER
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
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(500.0, 1.5e6)
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

      this.entities.push(marker, ring);
    });
  }

  setVisible(visible) {
    this.visible = visible;
    this.entities.forEach(ent => {
      ent.show = visible;
    });
  }

  toggle() {
    this.setVisible(!this.visible);
    return this.visible;
  }
}
