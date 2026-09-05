/**
 * 3D Orbit Trail & Ground Track Visualizer
 * Renders complete 3D orbital trajectory polyline and sub-satellite surface tracks.
 */

import * as Cesium from 'cesium';

export class OrbitVisualizer {
  /**
   * @param {Cesium.Viewer} viewer 
   */
  constructor(viewer) {
    this.viewer = viewer;
    this.orbitPolylineEntity = null;
    this.groundTrackEntity = null;
    this.visible = true;
  }

  /**
   * Render or update the 3D orbit trail and ground track
   * @param {Array} orbitPoints Array of sample points with .ecf and .lat/.lon
   * @param {Object} satConfig Satellite configuration
   */
  updateOrbitPath(orbitPoints, satConfig) {
    this.clear();

    if (!orbitPoints || orbitPoints.length < 2) return;

    const color = satConfig.primaryColor || '#00f0ff';
    const cesiumColor = Cesium.Color.fromCssColorString(color);

    // Convert ECF coordinates to Cesium Cartesian3 positions
    const cartesianPositions = orbitPoints.map(pt => new Cesium.Cartesian3(pt.ecf.x, pt.ecf.y, pt.ecf.z));

    // For closed loops (complete orbit), close the loop
    if (cartesianPositions.length > 0) {
      cartesianPositions.push(cartesianPositions[0]);
    }

    // 3D Orbital Trajectory Polyline
    this.orbitPolylineEntity = this.viewer.entities.add({
      name: `${satConfig.name} - 3D Orbit Trail`,
      show: this.visible,
      polyline: {
        positions: cartesianPositions,
        width: 3.0,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.25,
          taperPower: 0.9,
          color: cesiumColor.withAlpha(0.85)
        }),
        arcType: Cesium.ArcType.NONE
      }
    });

    // 2D Ground Track Polyline (on surface)
    // To handle antimeridian crossing smoothly, we split ground tracks if lon jumps > 180 deg
    const groundTrackSegments = [];
    let currentSegment = [];

    for (let i = 0; i < orbitPoints.length; i++) {
      const pt = orbitPoints[i];
      const cartographic = Cesium.Cartesian3.fromDegrees(pt.lon, pt.lat, 1000.0);

      if (currentSegment.length > 0) {
        const prevPt = orbitPoints[i - 1];
        if (Math.abs(pt.lon - prevPt.lon) > 180) {
          groundTrackSegments.push(currentSegment);
          currentSegment = [];
        }
      }
      currentSegment.push(cartographic);
    }
    if (currentSegment.length > 0) {
      groundTrackSegments.push(currentSegment);
    }

    // Add ground track segments
    this.groundTrackEntities = groundTrackSegments.map((segment, idx) => {
      return this.viewer.entities.add({
        name: `${satConfig.name} - Ground Track ${idx}`,
        show: this.visible,
        polyline: {
          positions: segment,
          width: 1.5,
          material: new Cesium.PolylineDashMaterialProperty({
            color: cesiumColor.withAlpha(0.4),
            dashLength: 16.0
          }),
          arcType: Cesium.ArcType.GEODESIC
        }
      });
    });
  }

  setVisible(visible) {
    this.visible = visible;
    if (this.orbitPolylineEntity) {
      this.orbitPolylineEntity.show = visible;
    }
    if (this.groundTrackEntities) {
      this.groundTrackEntities.forEach(e => e.show = visible);
    }
  }

  clear() {
    if (this.orbitPolylineEntity) {
      this.viewer.entities.remove(this.orbitPolylineEntity);
      this.orbitPolylineEntity = null;
    }
    if (this.groundTrackEntities) {
      this.groundTrackEntities.forEach(e => this.viewer.entities.remove(e));
      this.groundTrackEntities = [];
    }
  }
}
