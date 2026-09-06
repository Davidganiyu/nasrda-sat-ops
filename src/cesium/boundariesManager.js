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
        const isFct = boundaryType === 'fct';
        const isNational = boundaryType === 'national';

        if (entity.polygon) {
          // Extract boundary perimeter coordinates for glowing polyline overlay
          const hierarchy = entity.polygon.hierarchy?.getValue(Cesium.JulianDate.now());
          if (hierarchy && hierarchy.positions && hierarchy.positions.length > 2) {
            const closedPositions = [...hierarchy.positions, hierarchy.positions[0]];
            const color = isFct
              ? Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.75) // Glowing amber for FCT
              : Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.45); // Glowing cyan/teal (width: 1.5px, alpha: 0.45)

            entity.polyline = new Cesium.PolylineGraphics({
              positions: closedPositions,
              width: 1.5,
              material: new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.2,
                taperPower: 1.0,
                color: color
              }),
              clampToGround: true,
              arcType: Cesium.ArcType.GEODESIC
            });
          }

          // Subtle terrain-transparent fill so underlying satellite imagery is never obscured
          entity.polygon.material = Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.015);
          entity.polygon.outline = false;
        } else if (entity.polyline) {
          // National perimeter polyline
          entity.polyline.width = 2.5;
          entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.35,
            taperPower: 0.9,
            color: Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.85)
          });
          entity.polyline.clampToGround = true;
          entity.polyline.arcType = Cesium.ArcType.GEODESIC;
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
