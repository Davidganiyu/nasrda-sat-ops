/**
 * Tactical NASRDA Facility Beacons Manager
 * Renders 3D labeled beacon markers for major Nigerian space agency operational centers:
 * 1. NASRDA HQ / Ground Station (Abuja: 8.9925° N, 7.3986° E)
 * 2. Centre for Space Transport & Rocketry (CSTR) (Epe, Lagos: 6.58° N, 3.98° E)
 * 3. Centre for Geodesy and Geodynamics (CGG) (Toro, Bauchi: 10.06° N, 9.07° E)
 * 4. Centre for Basic Space Science (CBSS) (Nsukka, Enugu: 6.86° N, 7.41° E)
 */

import * as Cesium from 'cesium';

export const NASRDA_FACILITIES = [
  {
    id: 'nasrda-hq',
    name: 'NASRDA HQ / CSTD (Abuja)',
    callsign: 'CSTD-ABUJA',
    role: 'Primary TT&C & Satellite Command Facility',
    lat: 8.9925,
    lon: 7.3986,
    alt: 490, // meters
    color: '#00f0ff',
    iconType: 'DISH',
    details: 'Obasanjo Space Centre, Centre for Satellite Technology Development (CSTD) & National Space Operations Center'
  },
  {
    id: 'cbss-nsukka',
    name: 'Centre for Basic Space Science (CBSS, Nsukka)',
    callsign: 'CBSS-ENUGU',
    role: 'Radio Astronomy & Solar Physics',
    lat: 6.8600,
    lon: 7.4100,
    alt: 450,
    color: '#8b5cf6',
    iconType: 'OBSERVATORY',
    details: 'Optical and radio astronomy observatory, solar flares & ionospheric research (UNN Nsukka)'
  },
  {
    id: 'cgg-toro',
    name: 'Centre for Geodesy & Geodynamics (CGG, Toro)',
    callsign: 'CGG-BAUCHI',
    role: 'Crustal Deformation & Global Navigation',
    lat: 10.0600,
    lon: 9.0700,
    alt: 860,
    color: '#f59e0b',
    iconType: 'RADAR',
    details: 'GNSS reference station network, earthquake/seismic monitoring & geodetic datum'
  },
  {
    id: 'car-anyigba',
    name: 'Centre for Atmospheric Research (CAR, Anyigba)',
    callsign: 'CAR-KOGI',
    role: 'Ionospheric Physics & Space Weather',
    lat: 7.4900,
    lon: 7.1800,
    alt: 410,
    color: '#06b6d4',
    iconType: 'RADAR',
    details: 'Tropospheric dynamics, magnetospheric research & space weather forecasting (KSU Anyigba)'
  },
  {
    id: 'cstr-epe',
    name: 'Centre for Space Transport & Rocketry (CSTR, Epe)',
    callsign: 'CSTR-LAGOS',
    role: 'Launch Propulsion & Rocketry Systems',
    lat: 6.5800,
    lon: 3.9800,
    alt: 25,
    color: '#10b981',
    iconType: 'ROCKET',
    details: 'Rocket propulsion testing, aerodynamic engineering & launch vehicle research'
  }
];

export class FacilityBeaconsManager {
  /**
   * @param {Cesium.Viewer} viewer 
   */
  constructor(viewer) {
    this.viewer = viewer;
    this.entities = [];
    this.visible = true;
    this.initBeacons();
  }

  _generateBeaconSvg(color = '#00f0ff', iconType = 'DISH') {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="${color}" fill-opacity="0.2" />
        <circle cx="24" cy="24" r="14" fill="${color}" fill-opacity="0.35" />
        <circle cx="24" cy="24" r="6" fill="${color}" />
        
        <!-- Crosshairs -->
        <line x1="24" y1="2" x2="24" y2="46" stroke="${color}" stroke-width="1.5" stroke-dasharray="2 2" />
        <line x1="2" y1="24" x2="46" y2="24" stroke="${color}" stroke-width="1.5" stroke-dasharray="2 2" />
        
        <!-- Center Core Point -->
        <circle cx="24" cy="24" r="3" fill="#ffffff" />
      </svg>
    `;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  initBeacons() {
    NASRDA_FACILITIES.forEach(fac => {
      const position = Cesium.Cartesian3.fromDegrees(fac.lon, fac.lat, fac.alt);
      const color = Cesium.Color.fromCssColorString(fac.color);

      // 1. Tactical Billboard & Point
      const beacon = this.viewer.entities.add({
        name: fac.name,
        show: this.visible,
        position: position,
        billboard: {
          image: this._generateBeaconSvg(fac.color, fac.iconType),
          scale: 0.85,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        point: {
          pixelSize: 8,
          color: color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          scaleByDistance: new Cesium.NearFarScalar(1.0e3, 1.5, 2.0e7, 0.7),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: `${fac.name}\n[${fac.callsign}]`,
          font: 'bold 11px "Share Tech Mono", monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#030712'),
          outlineWidth: 3,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -26),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(100.0, 8.0e6),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        description: `
          <div style="font-family: monospace; color: #fff; padding: 6px;">
            <b style="color: ${fac.color}; font-size: 14px;">${fac.name}</b><br/>
            <b>Callsign:</b> ${fac.callsign}<br/>
            <b>Role:</b> ${fac.role}<br/>
            <b>Coordinates:</b> ${fac.lat.toFixed(4)}° N, ${fac.lon.toFixed(4)}° E (Elev: ${fac.alt}m)<br/>
            <p style="margin-top: 4px; color: #94a3b8;">${fac.details}</p>
          </div>
        `
      });
      beacon.facilityData = fac;

      // 2. Concentric Pulsing Tactical Ground Ring
      const groundRing = this.viewer.entities.add({
        name: `${fac.name} - Perimeter`,
        show: this.visible,
        position: position,
        ellipse: {
          semiMinorAxis: 15000, // 15 km radius
          semiMajorAxis: 15000,
          material: new Cesium.ColorMaterialProperty(color.withAlpha(0.12)),
          outline: true,
          outlineColor: color.withAlpha(0.75),
          outlineWidth: 1.5,
          height: fac.alt
        }
      });
      groundRing.facilityData = fac;

      this.entities.push(beacon, groundRing);
    });
  }

  setVisible(visible) {
    this.visible = visible;
    this.entities.forEach(ent => ent.show = visible);
  }
}
