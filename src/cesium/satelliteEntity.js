/**
 * 3D Satellite Entity Renderer
 * Plots satellite in Earth-Centered Fixed (ECF) space with procedural tactical billboard,
 * label, pulse aura, and nadir line to Earth surface.
 */

import * as Cesium from 'cesium';

export class SatelliteEntity {
  /**
   * @param {Cesium.Viewer} viewer 
   * @param {Object} satConfig 
   */
  constructor(viewer, satConfig) {
    this.viewer = viewer;
    this.satConfig = satConfig;
    this.entity = null;
    this.subSatellitePointEntity = null;
    this.nadirLineEntity = null;
    this.initEntities();
  }

  /**
   * Procedural SVG icon for satellite billboard
   */
  _generateSatelliteSvg(color = '#00f0ff') {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <!-- Glow Aura -->
        <circle cx="32" cy="32" r="28" fill="${color}" fill-opacity="0.25" />
        <circle cx="32" cy="32" r="18" fill="${color}" fill-opacity="0.4" />
        
        <!-- Solar Panels -->
        <rect x="4" y="27" width="16" height="10" rx="1" fill="#1e293b" stroke="${color}" stroke-width="1.5" />
        <line x1="12" y1="27" x2="12" y2="37" stroke="${color}" stroke-width="1" />
        <rect x="44" y="27" width="16" height="10" rx="1" fill="#1e293b" stroke="${color}" stroke-width="1.5" />
        <line x1="52" y1="27" x2="52" y2="37" stroke="${color}" stroke-width="1" />

        <!-- Satellite Bus -->
        <rect x="24" y="24" width="16" height="16" rx="2" fill="#0f172a" stroke="${color}" stroke-width="2" />
        
        <!-- Antenna Dish -->
        <path d="M26 24 C26 16, 38 16, 38 24" fill="none" stroke="${color}" stroke-width="2" />
        <line x1="32" y1="16" x2="32" y2="12" stroke="${color}" stroke-width="2" />
        <circle cx="32" cy="12" r="2" fill="#ef4444" />

        <!-- Center Status Dot -->
        <circle cx="32" cy="32" r="3" fill="${color}" />
      </svg>
    `;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  initEntities() {
    const color = this.satConfig.primaryColor || '#00f0ff';
    const cesiumColor = Cesium.Color.fromCssColorString(color);

    // Main Satellite 3D Entity
    this.entity = this.viewer.entities.add({
      name: this.satConfig.name,
      description: this.satConfig.purpose,
      position: Cesium.Cartesian3.ZERO,
      billboard: {
        image: this._generateSatelliteSvg(color),
        scale: 1.0,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        eyeOffset: new Cesium.Cartesian3(0, 0, -1000),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      point: {
        pixelSize: 10,
        color: cesiumColor,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 8.0e6, 0.8),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: `${this.satConfig.name} [${this.satConfig.noradId}]`,
        font: '13px "Share Tech Mono", monospace',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: Cesium.Color.fromCssColorString('#ffffff'),
        outlineColor: Cesium.Color.fromCssColorString('#030712'),
        outlineWidth: 4,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -28),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(100.0, 1.2e8),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    // Sub-satellite point marker on Earth surface
    this.subSatellitePointEntity = this.viewer.entities.add({
      name: `${this.satConfig.name} - Ground Track`,
      position: Cesium.Cartesian3.ZERO,
      point: {
        pixelSize: 6,
        color: cesiumColor.withAlpha(0.7),
        outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
        outlineWidth: 1
      }
    });

    // Nadir line connecting satellite to Earth sub-point
    this.nadirLineEntity = this.viewer.entities.add({
      polyline: {
        positions: [Cesium.Cartesian3.ZERO, Cesium.Cartesian3.ZERO],
        width: 1.5,
        material: new Cesium.PolylineDashMaterialProperty({
          color: cesiumColor.withAlpha(0.4),
          dashLength: 12.0
        })
      }
    });
  }

  /**
   * Update satellite position in 3D ECF frame
   * @param {Object} telemetry Calculated orbital telemetry
   */
  updatePosition(telemetry) {
    if (!telemetry || !this.entity) return;

    // Convert ECF coordinates (in km) to Cesium Cartesian3 (in meters)
    const ecfKm = telemetry.position.ecf;
    const satPositionMeters = new Cesium.Cartesian3(
      ecfKm.x * 1000,
      ecfKm.y * 1000,
      ecfKm.z * 1000
    );

    // Sub-satellite point on Earth surface (altitude = 0)
    const subSatPosition = Cesium.Cartesian3.fromDegrees(
      telemetry.position.lon,
      telemetry.position.lat,
      0
    );

    // Update positions
    this.entity.position = satPositionMeters;
    this.subSatellitePointEntity.position = subSatPosition;

    // Update Nadir line
    this.nadirLineEntity.polyline.positions = [satPositionMeters, subSatPosition];

    // Dynamic Label text with Altitude and Velocity
    const altStr = Math.round(telemetry.position.alt).toLocaleString();
    const velStr = telemetry.velocity.scalar.toFixed(2);
    this.entity.label.text = `${this.satConfig.name} | ${altStr} km | ${velStr} km/s`;
  }

  destroy() {
    if (this.entity) this.viewer.entities.remove(this.entity);
    if (this.subSatellitePointEntity) this.viewer.entities.remove(this.subSatellitePointEntity);
    if (this.nadirLineEntity) this.viewer.entities.remove(this.nadirLineEntity);
  }
}
