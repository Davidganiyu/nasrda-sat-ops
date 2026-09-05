/**
 * 3D Downlink Coverage Footprint & Sensor Beam Visualizer
 * Renders volumetric beam cone from satellite down to Nigeria / Abuja Ground Station
 * and illuminated coverage footprint zone on Earth surface.
 */

import * as Cesium from 'cesium';

export class FootprintCone {
  /**
   * @param {Cesium.Viewer} viewer 
   * @param {Object} satConfig 
   */
  constructor(viewer, satConfig) {
    this.viewer = viewer;
    this.satConfig = satConfig;
    this.footprintCircleEntity = null;
    this.beamConeLines = [];
    this.visible = true;
    this.initFootprint();
  }

  initFootprint() {
    const color = this.satConfig.primaryColor || '#00f0ff';
    const cesiumColor = Cesium.Color.fromCssColorString(color);

    // Target footprint center (Nigeria / Abuja for NigComSat-1R, or dynamic for LEO)
    const targetLon = this.satConfig.type === 'GEO' ? 8.0 : 7.3986;
    const targetLat = this.satConfig.type === 'GEO' ? 9.5 : 9.0765;
    const radiusMeters = (this.satConfig.footprintRadiusKm || 3000) * 1000;

    // Ground Footprint Circle / Ellipse
    this.footprintCircleEntity = this.viewer.entities.add({
      name: `${this.satConfig.name} - Downlink Footprint`,
      show: this.visible,
      position: Cesium.Cartesian3.fromDegrees(targetLon, targetLat, 0),
      ellipse: {
        semiMinorAxis: radiusMeters,
        semiMajorAxis: radiusMeters * 1.2,
        material: new Cesium.ColorMaterialProperty(cesiumColor.withAlpha(0.18)),
        outline: true,
        outlineColor: cesiumColor.withAlpha(0.75),
        outlineWidth: 2.5,
        height: 1000.0,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
      }
    });

    // Secondary Pulsing Inner Swath
    this.innerSwathEntity = this.viewer.entities.add({
      name: `${this.satConfig.name} - Primary Spot Beam`,
      show: this.visible,
      position: Cesium.Cartesian3.fromDegrees(targetLon, targetLat, 0),
      ellipse: {
        semiMinorAxis: radiusMeters * 0.45,
        semiMajorAxis: radiusMeters * 0.55,
        material: new Cesium.ColorMaterialProperty(cesiumColor.withAlpha(0.28)),
        outline: true,
        outlineColor: Cesium.Color.WHITE.withAlpha(0.85),
        outlineWidth: 2.0,
        height: 1500.0
      }
    });

    // Volumetric 3D Cone Edge Rays (connecting satellite to footprint boundary)
    const numRays = 8;
    this.beamConeLines = [];
    for (let i = 0; i < numRays; i++) {
      const lineEntity = this.viewer.entities.add({
        show: this.visible,
        polyline: {
          positions: [Cesium.Cartesian3.ZERO, Cesium.Cartesian3.ZERO],
          width: 1.5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.15,
            color: cesiumColor.withAlpha(0.5)
          })
        }
      });
      this.beamConeLines.push(lineEntity);
    }
  }

  /**
   * Update footprint positions and beam projection
   * @param {Object} telemetry 
   */
  update(telemetry) {
    if (!telemetry || !this.visible) return;

    const satEcfKm = telemetry.position.ecf;
    const satPosMeters = new Cesium.Cartesian3(
      satEcfKm.x * 1000,
      satEcfKm.y * 1000,
      satEcfKm.z * 1000
    );

    // For GEO satellite, footprint is steered toward Nigeria (West Africa).
    // For LEO satellites, footprint follows the sub-satellite point directly.
    let centerLon = telemetry.position.lon;
    let centerLat = telemetry.position.lat;
    let radiusMeters = (this.satConfig.footprintRadiusKm || 600) * 1000;

    if (this.satConfig.type === 'GEO') {
      // Steered down toward Nigeria / West Africa
      centerLon = 8.5;
      centerLat = 9.5;
      radiusMeters = (this.satConfig.footprintRadiusKm || 3800) * 1000;
    }

    const centerCartesian = Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 0);

    if (this.footprintCircleEntity) {
      this.footprintCircleEntity.position = centerCartesian;
    }
    if (this.innerSwathEntity) {
      this.innerSwathEntity.position = centerCartesian;
    }

    // Update 3D Beam Cone Rays
    const numRays = this.beamConeLines.length;
    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2;
      // Offset footprint perimeter point in degrees approx
      const dLat = (radiusMeters / 111320) * Math.sin(angle);
      const dLon = (radiusMeters / (111320 * Math.cos(Cesium.Math.toRadians(centerLat)))) * Math.cos(angle);
      
      const rimPoint = Cesium.Cartesian3.fromDegrees(centerLon + dLon, centerLat + dLat, 0);
      this.beamConeLines[i].polyline.positions = [satPosMeters, rimPoint];
    }
  }

  setVisible(visible) {
    this.visible = visible;
    if (this.footprintCircleEntity) this.footprintCircleEntity.show = visible;
    if (this.innerSwathEntity) this.innerSwathEntity.show = visible;
    this.beamConeLines.forEach(l => l.show = visible);
  }

  destroy() {
    if (this.footprintCircleEntity) this.viewer.entities.remove(this.footprintCircleEntity);
    if (this.innerSwathEntity) this.viewer.entities.remove(this.innerSwathEntity);
    this.beamConeLines.forEach(l => this.viewer.entities.remove(l));
    this.beamConeLines = [];
  }
}
