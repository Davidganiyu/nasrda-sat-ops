/**
 * Tactical Landmarks Registry for Instant Camera Fly-To Navigation
 * National Space Research and Development Agency (NASRDA)
 */

export const LANDMARKS = [
  {
    id: 'abuja-ttc',
    name: 'NASRDA HQ / TT&C (Abuja)',
    shortName: 'ABUJA TT&C',
    category: 'GROUND_STATION',
    latitude: 8.9900,
    longitude: 7.3900,
    altitude: 3500, // meters
    heading: 0.0,
    pitch: -35.0, // degrees
    roll: 0.0,
    duration: 2.0,
    description: 'CSTD Primary Telemetry, Tracking & Command Ground Station Facility'
  },
  {
    id: 'lagos-offshore',
    name: 'Lagos Offshore / Gulf of Guinea',
    shortName: 'LAGOS OFFSHORE',
    category: 'MARITIME_OBSERVATION',
    latitude: 6.4200,
    longitude: 3.4200,
    altitude: 15000, // meters
    heading: 45.0,
    pitch: -45.0,
    roll: 0.0,
    duration: 2.0,
    description: 'Bight of Benin maritime shipping channel & offshore energy corridor'
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
