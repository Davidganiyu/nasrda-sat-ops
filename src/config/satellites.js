/**
 * Nigerian Satellite Constellation Metadata & Fallback Two-Line Element (TLE) Catalog
 * National Space Research and Development Agency (NASRDA)
 */

export const GROUND_STATIONS = {
  abuja: {
    id: 'CSTD-ABUJA-01',
    name: 'NASRDA HQ Ground Station',
    location: 'Abuja, Nigeria',
    latitude: 8.9900, // degrees North (8.99° N)
    longitude: 7.3900, // degrees East (7.39° E)
    altitude: 0.490, // km (490m ASL)
    minElevation: 5.0, // degrees threshold for LOS acquisition
    frequencyBands: ['C-Band (4-8 GHz)', 'Ku-Band (12-18 GHz)', 'Ka-Band (26.5-40 GHz)', 'S-Band (2-4 GHz)'],
    description: 'Centre for Satellite Technology Development (CSTD) Telemetry, Tracking & Command (TT&C) Facility'
  }
};

export const SATELLITE_CATALOG = [
  {
    id: 'nigcomsat-1r',
    noradId: 38014,
    name: 'NigComSat-1R',
    designation: '2011-077A',
    type: 'GEO',
    orbitClass: 'Geostationary Orbit (42.5° E)',
    operator: 'NIGCOMSAT Ltd / NASRDA',
    launchDate: '2011-12-19',
    launchVehicle: 'Long March 3B/E',
    launchSite: 'Xichang Satellite Launch Center, China',
    purpose: 'Telecommunications, Broadcasting, Broadband & Navigation Overlay',
    payload: '28 Active Transponders (4 C-band, 14 Ku-band, 8 Ka-band, 2 L-band)',
    primaryColor: '#00f0ff',
    trailColor: 'rgba(0, 240, 255, 0.85)',
    footprintRadiusKm: 3800, // Downlink coverage cone footprint radius over Africa
    nominalAltitudeKm: 35786,
    coverageArea: 'West Africa, Central Africa, Southern Africa, Europe & Middle East',
    transponderStatus: 'NOMINAL / 100% OPERATIONAL',
    defaultTle: {
      line1: '1 38014U 11077A   26242.48621528  .00000124  00000-0  00000-0 0  9993',
      line2: '2 38014   0.0412  42.5120 0002145 184.3412  95.1245  1.00273412 53718'
    }
  },
  {
    id: 'nigeriasat-2',
    noradId: 37789,
    name: 'NigeriaSat-2',
    designation: '2011-044B',
    type: 'LEO',
    orbitClass: 'Low Earth Sun-Synchronous (SSO)',
    operator: 'NASRDA (Earth Observation)',
    launchDate: '2011-08-17',
    launchVehicle: 'Dnepr',
    launchSite: 'Yasny Launch Base, Russia',
    purpose: 'High-Resolution Earth Observation, Disaster Monitoring, Mapping & Agriculture',
    payload: '2.5m Panchromatic, 5m Multi-spectral & 32m DMC Wide-Swath Imager',
    primaryColor: '#10b981',
    trailColor: 'rgba(16, 185, 129, 0.85)',
    footprintRadiusKm: 600,
    nominalAltitudeKm: 700,
    coverageArea: 'Global Swath (Repeat cycle 4 days)',
    transponderStatus: 'IMAGING SENSORS ACTIVE',
    defaultTle: {
      line1: '1 37789U 11044B   26242.51421045  .00000284  00000-0  54210-4 0  9997',
      line2: '2 37789  98.2415 298.4120 0012541  74.5120 285.8140 14.81245012781423'
    }
  },
  {
    id: 'nigeriasat-x',
    noradId: 37790,
    name: 'NigeriaSat-X',
    designation: '2011-044C',
    type: 'LEO',
    orbitClass: 'Low Earth Sun-Synchronous (SSO)',
    operator: 'NASRDA (Engineered by Nigerian Engineers)',
    launchDate: '2011-08-17',
    launchVehicle: 'Dnepr',
    launchSite: 'Yasny Launch Base, Russia',
    purpose: 'Indigenous Technology Demonstrator & 22m Multispectral Earth Observation',
    payload: '22m Multi-spectral Imager (Green, Red, NIR bands)',
    primaryColor: '#f59e0b',
    trailColor: 'rgba(245, 158, 11, 0.85)',
    footprintRadiusKm: 550,
    nominalAltitudeKm: 700,
    coverageArea: 'Global Swath (Disaster Monitoring Constellation)',
    transponderStatus: 'TELEM / BEACON ACTIVE',
    defaultTle: {
      line1: '1 37790U 11044C   26242.51241088  .00000310  00000-0  59120-4 0  9991',
      line2: '2 37790  98.2380 298.4050 0013204  78.2140 282.1080 14.81198541781395'
    }
  },
  {
    id: 'eos-1-sar',
    noradId: 99101,
    name: 'EOS-1 / SAR-1 (Planned Constellation)',
    shortName: 'EOS-1 / SAR-1',
    designation: 'PLANNED-FEC-2026',
    type: 'LEO',
    orbitClass: 'Sun-Synchronous LEO (Dawn-Dusk 550 km)',
    operator: 'NASRDA / Federal Ministry of Innovation, Science & Tech',
    launchDate: 'PLANNED (FEC APPROVED)',
    launchVehicle: 'Commercial Heavy Lift',
    launchSite: 'International Spaceport',
    purpose: 'Next-Gen Earth Observation & Synthetic Aperture Radar (SAR) Constellation for National Defense & Agriculture Monitoring',
    payload: 'X-Band Synthetic Aperture Radar (0.5m SpotSAR), 0.75m Hyperspectral Imager & AIS Maritime Radar',
    primaryColor: '#ec4899',
    trailColor: 'rgba(236, 72, 153, 0.85)',
    footprintRadiusKm: 650,
    nominalAltitudeKm: 550,
    coverageArea: 'Nigeria Sovereign Land & Maritime Borders, Gulf of Guinea & All-Weather Day/Night Global Swath',
    transponderStatus: 'PHASE-D / INTEGRATION & SIMULATION',
    defaultTle: {
      line1: '1 99101U 26001A   26242.52000000  .00000350  00000-0  48000-4 0  9990',
      line2: '2 99101  97.6500 120.4500 0011500  65.3000 295.1000 15.15000000    12'
    }
  }
];

export const DEFAULT_SATELLITE_ID = 'nigcomsat-1r';
