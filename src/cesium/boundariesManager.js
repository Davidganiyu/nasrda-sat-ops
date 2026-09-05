/**
 * Nigeria National & State Tactical Vector Boundaries Manager
 * Ingests Nigeria GeoJSON boundary dataset (national perimeter + state lines)
 * rendered as glowing cyan/teal polylines so Nigeria's territory and states
 * are immediately recognizable on the globe across all zoom levels.
 */

import * as Cesium from 'cesium';
import { NIGERIA_BOUNDARIES_GEOJSON } from '../data/nigeriaBoundariesGeoJson.js';

export class BoundariesManager {
  /**
   * @param {Cesium.Viewer} viewer 
   */
  constructor(viewer) {
    this.viewer = viewer;
    this.dataSource = null;
    this.visible = true;
    this.initBoundaries();
  }

  async initBoundaries() {
    try {
      // Ingest GeoJSON boundary dataset using Cesium's GeoJsonDataSource
      const dataSource = await Cesium.GeoJsonDataSource.load(NIGERIA_BOUNDARIES_GEOJSON, {
        stroke: Cesium.Color.fromCssColorString('#00f0ff'),
        fill: Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.04),
        strokeWidth: 3,
        clampToGround: true
      });

      this.dataSource = dataSource;
      this.dataSource.show = this.visible;

      // Apply tactical glowing vector line materials across features
      const entities = dataSource.entities.values;
      for (const entity of entities) {
        const boundaryType = entity.properties?.boundaryType?.getValue();

        if (entity.polyline) {
          let color = Cesium.Color.fromCssColorString('#2dd4bf').withAlpha(0.75); // Teal for states
          let width = 1.8;
          let glow = 0.25;

          if (boundaryType === 'national') {
            color = Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.95); // Glowing Cyan
            width = 3.5;
            glow = 0.35;
          } else if (boundaryType === 'fct') {
            color = Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.85); // Glowing Amber for FCT Abuja
            width = 2.5;
            glow = 0.30;
          }

          entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
            glowPower: glow,
            taperPower: 0.9,
            color: color
          });
          entity.polyline.width = width;
          entity.polyline.arcType = Cesium.ArcType.GEODESIC;
          entity.polyline.clampToGround = true;
        }

        if (entity.polygon) {
          entity.polygon.material = Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.035);
          entity.polygon.outline = false;
          entity.polygon.arcType = Cesium.ArcType.GEODESIC;
        }
      }

      await this.viewer.dataSources.add(this.dataSource);
      console.log(`[BoundariesManager] Ingested ${entities.length} GeoJSON boundary vector features for Nigeria.`);
    } catch (err) {
      console.error('[BoundariesManager] Error ingesting GeoJSON boundaries:', err);
    }
  }

  setVisible(visible) {
    this.visible = visible;
    if (this.dataSource) {
      this.dataSource.show = visible;
    }
  }

  toggle() {
    this.setVisible(!this.visible);
    return this.visible;
  }
}
