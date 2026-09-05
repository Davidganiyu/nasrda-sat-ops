/**
 * Abuja Ground Station & Communication Link Visualizer
 * Marks NASRDA HQ / CSTD Telemetry, Tracking & Command (TT&C) facility (8.99° N, 7.39° E) and
 * projects real-time RF communication laser beam directly to the tracked satellite.
 */

import * as Cesium from 'cesium';
import { GROUND_STATIONS } from '../config/satellites.js';

export class GroundStationVisualizer {
  /**
   * @param {Cesium.Viewer} viewer 
   * @param {Object} stationConfig 
   */
  constructor(viewer, stationConfig = GROUND_STATIONS.abuja) {
    this.viewer = viewer;
    this.station = stationConfig;
    this.stationEntity = null;
    this.radarRingEntity = null;
    this.laserLinkEntity = null;
    this.currentSatPosition = null; // Cesium.Cartesian3
    this.isLinkAcquired = true;
    this.hasLos = true;
    this.visible = true;
    this.initStation();
  }

  /**
   * Procedural SVG icon for ground station antenna dish
   */
  _generateDishSvg() {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="#10b981" fill-opacity="0.2" />
        <circle cx="24" cy="24" r="14" fill="#10b981" fill-opacity="0.35" />
        <!-- Radar Grid Crosshair -->
        <line x1="24" y1="2" x2="24" y2="46" stroke="#10b981" stroke-width="1.5" stroke-dasharray="2 2" />
        <line x1="2" y1="24" x2="46" y2="24" stroke="#10b981" stroke-width="1.5" stroke-dasharray="2 2" />
        <!-- Dish Arc -->
        <path d="M12 30 C12 18, 36 18, 36 30" fill="none" stroke="#ffffff" stroke-width="2.5" />
        <line x1="24" y1="18" x2="24" y2="12" stroke="#ffffff" stroke-width="2" />
        <!-- Center Target Dot -->
        <circle cx="24" cy="24" r="4" fill="#10b981" stroke="#ffffff" stroke-width="1.5" />
      </svg>
    `;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  initStation() {
    const stationCartesian = Cesium.Cartesian3.fromDegrees(
      this.station.longitude,
      this.station.latitude,
      this.station.altitude * 1000
    );
    this.stationPosition = stationCartesian;

    // Ground Station TT&C Node Entity
    this.stationEntity = this.viewer.entities.add({
      name: `${this.station.name} (${this.station.id})`,
      position: stationCartesian,
      billboard: {
        image: this._generateDishSvg(),
        scale: 0.9,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER
      },
      point: {
        pixelSize: 9,
        color: Cesium.Color.fromCssColorString('#10b981'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      label: {
        text: `TT&C GROUND STATION [ABUJA] (${this.station.latitude.toFixed(2)}°N, ${this.station.longitude.toFixed(2)}°E)`,
        font: '12px "Share Tech Mono", monospace',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: Cesium.Color.fromCssColorString('#10b981'),
        outlineColor: Cesium.Color.fromCssColorString('#030712'),
        outlineWidth: 3,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        pixelOffset: new Cesium.Cartesian2(0, 22),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(100.0, 6.0e7)
      }
    });

    // Pulsing Ground Radar Coverage Ring (5 deg minimum elevation horizon circle)
    this.radarRingEntity = this.viewer.entities.add({
      name: `${this.station.id} - TT&C Horizon Ring`,
      position: stationCartesian,
      ellipse: {
        semiMinorAxis: 180000, // 180 km radius
        semiMajorAxis: 180000,
        material: new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString('#10b981').withAlpha(0.15)),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.75),
        outlineWidth: 2.0,
        height: 500.0
      }
    });

    // Dynamic CallbackProperty for Laser Link connecting directly to Satellite
    const positionsCallback = new Cesium.CallbackProperty(() => {
      if (!this.currentSatPosition) {
        return [this.stationPosition, this.stationPosition];
      }
      return [this.stationPosition, this.currentSatPosition];
    }, false);

    // Dynamic Material Callback
    const materialCallback = new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.35,
      taperPower: 0.8,
      color: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.95)
    });

    // Real-time Uplink/Downlink Laser Link Beam
    this.laserLinkEntity = this.viewer.entities.add({
      name: `TT&C RF Laser Link -> Satellite`,
      show: this.visible,
      polyline: {
        positions: positionsCallback,
        width: 3.0,
        material: materialCallback,
        arcType: Cesium.ArcType.NONE
      }
    });
  }

  /**
   * Update laser link connecting Ground Station to Satellite
   * @param {Object} telemetry 
   */
  updateLink(telemetry) {
    if (!telemetry || !this.laserLinkEntity) return;

    const satEcfKm = telemetry.position.ecf;
    this.currentSatPosition = new Cesium.Cartesian3(
      satEcfKm.x * 1000,
      satEcfKm.y * 1000,
      satEcfKm.z * 1000
    );

    this.isLinkAcquired = telemetry.lookAngles.isAcquired;
    this.hasLos = telemetry.lookAngles.hasLos;

    // Adjust Laser Link glow and color based on Line of Sight
    if (this.isLinkAcquired) {
      this.laserLinkEntity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.4,
        taperPower: 0.85,
        color: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.95)
      });
      this.laserLinkEntity.polyline.width = 3.5;
    } else if (this.hasLos) {
      this.laserLinkEntity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.25,
        taperPower: 0.85,
        color: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.8)
      });
      this.laserLinkEntity.polyline.width = 2.5;
    } else {
      this.laserLinkEntity.polyline.material = new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.4),
        dashLength: 16.0
      });
      this.laserLinkEntity.polyline.width = 1.5;
    }
  }

  setVisible(visible) {
    this.visible = visible;
    if (this.stationEntity) this.stationEntity.show = visible;
    if (this.radarRingEntity) this.radarRingEntity.show = visible;
    if (this.laserLinkEntity) this.laserLinkEntity.show = visible;
  }
}
