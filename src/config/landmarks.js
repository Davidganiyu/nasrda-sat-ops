/**
 * Tactical Landmarks Registry for Instant Camera Fly-To Navigation
 * National Space Research and Development Agency (NASRDA)
 */

export const LANDMARKS = [
  {
    id: 'abuja-ttc',
    name: 'NASRDA HQ / CSTD (Abuja)',
    shortName: 'NASRDA HQ / CSTD',
    category: 'PRIMARY_TT_C',
    latitude: 8.9925,
    longitude: 7.3986,
    altitude: 40000, // 40km altitude downward pitch -45°
    heading: 0.0,
    pitch: -45.0,
    roll: 0.0,
    duration: 2.0,
    description: 'Obasanjo Space Centre, Centre for Satellite Technology Development (CSTD) & National Space Operations Center'
  },
  {
    id: 'enugu-cbss',
    name: 'Centre for Basic Space Science (CBSS, Nsukka)',
    shortName: 'CBSS (NSUKKA)',
    category: 'ASTROPHYSICS_ATMOSPHERE',
    latitude: 6.8600,
    longitude: 7.4100,
    altitude: 60000, // 60km altitude
    heading: 0.0,
    pitch: -45.0,
    roll: 0.0,
    duration: 2.0,
    description: 'Centre for Basic Space Science (CBSS), University of Nigeria Nsukka, Enugu State'
  },
  {
    id: 'bauchi-cgg',
    name: 'Centre for Geodesy & Geodynamics (CGG, Toro)',
    shortName: 'CGG (TORO)',
    category: 'GEODESY_SEISMOLOGY',
    latitude: 10.0600,
    longitude: 9.0700,
    altitude: 60000, // 60km altitude
    heading: 0.0,
    pitch: -45.0,
    roll: 0.0,
    duration: 2.0,
    description: 'Centre for Geodesy & Geodynamics (CGG), Toro, Bauchi State'
  },
  {
    id: 'kogi-car',
    name: 'Centre for Atmospheric Research (CAR, Anyigba)',
    shortName: 'CAR (ANYIGBA)',
    category: 'ATMOSPHERIC_IONOSPHERE',
    latitude: 7.4900,
    longitude: 7.1800,
    altitude: 60000, // 60km altitude
    heading: 0.0,
    pitch: -45.0,
    roll: 0.0,
    duration: 2.0,
    description: 'Centre for Atmospheric Research (CAR), Kogi State University, Anyigba'
  },
  {
    id: 'lagos-cstr',
    name: 'Centre for Space Transport & Rocketry (CSTR, Epe)',
    shortName: 'CSTR (EPE)',
    category: 'ROCKETRY_PROPULSION',
    latitude: 6.5800,
    longitude: 3.9800,
    altitude: 60000, // 60km altitude
    heading: 0.0,
    pitch: -45.0,
    roll: 0.0,
    duration: 2.0,
    description: 'NASRDA Centre for Space Transport & Rocketry (CSTR), Epe, Lagos State'
  },
  {
    id: 'nigeria-extent',
    name: 'Nigeria National Extent',
    shortName: 'NIGERIA EXTENT',
    category: 'NATIONAL_OVERVIEW',
    latitude: 8.5000,
    longitude: 8.0000,
    altitude: 2200000, // 2,200 km
    heading: 0.0,
    pitch: -85.0,
    roll: 0.0,
    duration: 2.2,
    description: 'Sovereign border extent of the Federal Republic of Nigeria'
  },
  {
    id: 'geo-orbit',
    name: 'Deep Space Orbit (GEO 42.5° E)',
    shortName: 'DEEP SPACE GEO',
    category: 'ORBITAL_PLANE',
    latitude: 0.0000,
    longitude: 42.5000,
    altitude: 45000000, // 45,000 km
    heading: 0.0,
    pitch: -90.0,
    roll: 0.0,
    duration: 2.5,
    description: 'Geostationary orbital arc overlooking African continent & NigComSat-1R'
  }
];
