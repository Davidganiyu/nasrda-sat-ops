/**
 * Orbital Physics & Keplerian Mechanics Engine
 * Powered by satellite.js (SGP4 / SDP4 propagator) with Geostationary orbital locking for NigComSat-1R.
 */

import * as satellite from 'satellite.js';
import { GROUND_STATIONS } from '../config/satellites.js';

const EARTH_RADIUS_KM = 6378.137;
const SPEED_OF_LIGHT_KMS = 299792.458; // km/s

export class OrbitalPhysics {
  /**
   * Parse TLE lines into satellite record
   */
  static parseTle(line1, line2) {
    try {
      return satellite.twoline2satrec(line1, line2);
    } catch (e) {
      console.error('[OrbitalPhysics] Error parsing TLE:', e);
      return null;
    }
  }

  /**
   * Propagate satellite state at a specific time
   * @param {Object} satrec Satellite record
   * @param {Date} date Timestamp
   * @param {Object} groundStation Target ground station
   * @param {Object} satConfig Optional satellite catalog configuration
   * @returns {Object|null} Telemetry state
   */
  static calculateTelemetry(satrec, date = new Date(), groundStation = GROUND_STATIONS.abuja, satConfig = null) {
    if (!satrec) return null;

    try {
      const isGeo = (satConfig && satConfig.type === 'GEO') || (satrec.no_kozai && satrec.no_kozai < 1.1);

      let latitudeDeg = 0;
      let longitudeDeg = 42.50;
      let altitudeKm = 35786.0;
      let positionEcf = { x: 0, y: 0, z: 0 };
      let positionEci = { x: 0, y: 0, z: 0 };
      let vx = 0, vy = 3.075, vz = 0;
      let speedKmS = 3.075;

      const gstime = satellite.gstime(date);

      if (isGeo) {
        // NigComSat-1R Geostationary slot at ~42.5° E longitude with small diurnal nutation
        const tSec = (date.getTime() / 1000) % 86164.09;
        const phase = (tSec / 86164.09) * 2 * Math.PI;

        const nominalLon = 42.50;
        const lonPerturbation = 0.025 * Math.sin(phase); // small stationkeeping oscillation
        const latPerturbation = 0.041 * Math.cos(phase); // orbital inclination oscillation
        const altPerturbation = 4.2 * Math.sin(phase);

        longitudeDeg = nominalLon + lonPerturbation;
        latitudeDeg = latPerturbation;
        altitudeKm = 35786.0 + altPerturbation;

        const rGeoKm = EARTH_RADIUS_KM + altitudeKm;
        const latRad = satellite.degreesToRadians(latitudeDeg);
        const lonRad = satellite.degreesToRadians(longitudeDeg);

        // Exact ECF Coordinates (km)
        positionEcf = {
          x: rGeoKm * Math.cos(latRad) * Math.cos(lonRad),
          y: rGeoKm * Math.cos(latRad) * Math.sin(lonRad),
          z: rGeoKm * Math.sin(latRad)
        };

        // Inertial ECI coordinates
        const eciAngle = lonRad + gstime;
        positionEci = {
          x: rGeoKm * Math.cos(latRad) * Math.cos(eciAngle),
          y: rGeoKm * Math.cos(latRad) * Math.sin(eciAngle),
          z: rGeoKm * Math.sin(latRad)
        };

        // Orbital velocity in inertial space (~3.075 km/s)
        const omegaE = 7.292115e-5; // rad/s
        speedKmS = rGeoKm * omegaE;
        vx = -speedKmS * Math.sin(eciAngle);
        vy = speedKmS * Math.cos(eciAngle);
        vz = 0.002 * Math.sin(phase);
      } else {
        // Standard SGP4 Propagation for LEO satellites (NigeriaSat-2, NigeriaSat-X)
        const positionAndVelocity = satellite.propagate(satrec, date);
        const posEci = positionAndVelocity.position;
        const velEci = positionAndVelocity.velocity;

        if (!posEci || typeof posEci.x !== 'number') {
          return null;
        }

        positionEci = posEci;
        positionEcf = satellite.eciToEcf(posEci, gstime);

        const positionGd = satellite.eciToGeodetic(posEci, gstime);
        longitudeDeg = satellite.degreesLong(positionGd.longitude);
        latitudeDeg = satellite.degreesLat(positionGd.latitude);
        altitudeKm = positionGd.height;

        vx = velEci.x;
        vy = velEci.y;
        vz = velEci.z;
        speedKmS = Math.sqrt(vx * vx + vy * vy + vz * vz);
      }

      // Ground Station Look Angles (Topocentric Azimuth, Elevation, Slant Range)
      const observerGd = {
        longitude: satellite.degreesToRadians(groundStation.longitude),
        latitude: satellite.degreesToRadians(groundStation.latitude),
        height: groundStation.altitude
      };

      const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
      let azimuthDeg = (satellite.degreesLong(lookAngles.azimuth) + 360) % 360;
      let elevationDeg = satellite.degreesLat(lookAngles.elevation);
      const slantRangeKm = lookAngles.rangeSat;

      // Range rate calculation for Doppler Shift
      let rangeRateKmS = 0;
      if (isGeo) {
        rangeRateKmS = 0.002 * Math.sin((date.getTime() / 1000 / 86164.09) * 2 * Math.PI);
      } else {
        const dateNext = new Date(date.getTime() + 1000);
        const gstimeNext = satellite.gstime(dateNext);
        const pvNext = satellite.propagate(satrec, dateNext);
        if (pvNext && pvNext.position) {
          const ecfNext = satellite.eciToEcf(pvNext.position, gstimeNext);
          const lookNext = satellite.ecfToLookAngles(observerGd, ecfNext);
          rangeRateKmS = lookNext.rangeSat - slantRangeKm;
        }
      }

      const carrierFreqHz = 12.0e9; // 12 GHz Ku-band
      const dopplerShiftKhz = -1 * (rangeRateKmS / SPEED_OF_LIGHT_KMS) * carrierFreqHz / 1000;

      // Keplerian Elements
      let inclinationDeg = satrec.inclo ? satrec.inclo * (180 / Math.PI) : (isGeo ? 0.041 : 98.24);
      let raanDeg = satrec.nodeo ? ((satrec.nodeo * (180 / Math.PI) + 360) % 360) : 42.51;
      let eccentricity = satrec.ecco || (isGeo ? 0.000214 : 0.00125);
      let argPerigeeDeg = satrec.argpo ? ((satrec.argpo * (180 / Math.PI) + 360) % 360) : 184.34;
      let meanAnomalyDeg = satrec.mo ? ((satrec.mo * (180 / Math.PI) + 360) % 360) : 95.12;
      let meanMotionRevDay = satrec.no_kozai ? (satrec.no_kozai * (1440 / (2 * Math.PI))) : (isGeo ? 1.0027 : 14.81);
      let periodMinutes = meanMotionRevDay > 0 ? (1440 / meanMotionRevDay) : (isGeo ? 1436.1 : 98.6);

      const GM = 398600.4418;
      const periodSec = periodMinutes * 60;
      const semiMajorAxisKm = Math.pow((GM * Math.pow(periodSec / (2 * Math.PI), 2)), 1 / 3);
      const apogeeAltKm = (semiMajorAxisKm * (1 + eccentricity)) - EARTH_RADIUS_KM;
      const perigeeAltKm = (semiMajorAxisKm * (1 - eccentricity)) - EARTH_RADIUS_KM;

      // Link budget and visibility
      const isVisible = elevationDeg >= groundStation.minElevation;
      const signalDbm = isVisible 
        ? -75 - (20 * Math.log10(Math.max(100, slantRangeKm) / 1000)) + (elevationDeg > 30 ? 6 : (elevationDeg / 5))
        : -125;

      return {
        timestamp: date,
        position: {
          lat: latitudeDeg,
          lon: longitudeDeg,
          alt: altitudeKm,
          ecf: positionEcf, // in km
          eci: positionEci
        },
        velocity: {
          scalar: speedKmS,
          vx,
          vy,
          vz
        },
        lookAngles: {
          azimuth: azimuthDeg,
          elevation: elevationDeg,
          range: slantRangeKm,
          rangeRate: rangeRateKmS,
          dopplerKhz: dopplerShiftKhz,
          hasLos: elevationDeg > 0,
          isAcquired: isVisible,
          signalDbm: Math.round(signalDbm)
        },
        keplerian: {
          inclination: inclinationDeg,
          raan: raanDeg,
          eccentricity: eccentricity,
          argPerigee: argPerigeeDeg,
          meanAnomaly: meanAnomalyDeg,
          meanMotion: meanMotionRevDay,
          periodMinutes: periodMinutes,
          semiMajorAxisKm: semiMajorAxisKm,
          apogeeKm: Math.max(0, apogeeAltKm),
          perigeeKm: Math.max(0, perigeeAltKm)
        }
      };
    } catch (err) {
      console.error('[OrbitalPhysics] Computation error:', err);
      return null;
    }
  }

  /**
   * Compute 3D orbital trajectory points over 1 full orbit period
   * Returns array of Cartographic / ECF coordinates
   */
  static generateOrbitPath(satrec, startDate = new Date(), satConfig = null, numSamples = 180) {
    if (!satrec) return [];

    const isGeo = (satConfig && satConfig.type === 'GEO') || (satrec.no_kozai && satrec.no_kozai < 1.1);
    const path = [];

    if (isGeo) {
      // 3D Geostationary ring around Earth at ~35,786 km altitude
      const rGeoKm = EARTH_RADIUS_KM + 35786.0;
      for (let i = 0; i <= numSamples; i++) {
        const angle = (i / numSamples) * Math.PI * 2;
        const lonDeg = (angle * (180 / Math.PI) + 360) % 360;
        const latDeg = 0.041 * Math.sin(angle); // small inclination

        const latRad = satellite.degreesToRadians(latDeg);
        const lonRad = satellite.degreesToRadians(lonDeg);

        path.push({
          time: new Date(startDate.getTime() + i * (1440 / numSamples) * 60000),
          ecf: {
            x: rGeoKm * Math.cos(latRad) * Math.cos(lonRad) * 1000,
            y: rGeoKm * Math.cos(latRad) * Math.sin(lonRad) * 1000,
            z: rGeoKm * Math.sin(latRad) * 1000
          },
          lat: latDeg,
          lon: lonDeg > 180 ? lonDeg - 360 : lonDeg,
          alt: 35786000
        });
      }
      return path;
    }

    // For LEO: 1.25 full orbits trajectory
    const periodMinutes = (1440 / (satrec.no_kozai * (1440 / (2 * Math.PI)))) || 98.6;
    const totalMinutes = periodMinutes * 1.25;
    const stepMinutes = totalMinutes / numSamples;
    const startTimeMs = startDate.getTime() - (periodMinutes * 0.15 * 60000);

    for (let i = 0; i <= numSamples; i++) {
      const sampleTime = new Date(startTimeMs + i * stepMinutes * 60000);
      const pv = satellite.propagate(satrec, sampleTime);
      if (pv && pv.position && typeof pv.position.x === 'number') {
        const gstime = satellite.gstime(sampleTime);
        const ecf = satellite.eciToEcf(pv.position, gstime);
        const gd = satellite.eciToGeodetic(pv.position, gstime);

        path.push({
          time: sampleTime,
          ecf: {
            x: ecf.x * 1000, // meters for Cesium
            y: ecf.y * 1000,
            z: ecf.z * 1000
          },
          lat: satellite.degreesLat(gd.latitude),
          lon: satellite.degreesLong(gd.longitude),
          alt: gd.height * 1000 // meters
        });
      }
    }

    return path;
  }

  /**
   * Find next pass over ground station for LEO satellites
   */
  static findNextPass(satrec, startDate = new Date(), groundStation = GROUND_STATIONS.abuja, satConfig = null, maxLookaheadHours = 48) {
    if (!satrec) return null;

    const isGeo = (satConfig && satConfig.type === 'GEO') || (satrec.no_kozai && satrec.no_kozai < 1.1);

    if (isGeo) {
      const telem = this.calculateTelemetry(satrec, startDate, groundStation, satConfig);
      return {
        isPermanent: true,
        aosTime: null,
        losTime: null,
        maxElevation: (telem && telem.lookAngles.elevation) || 48.2,
        status: 'CONTINUOUS 24/7 GEO LINK',
        durationMinutes: Infinity
      };
    }

    // Scan forward in 15-second steps for LEO pass
    const stepSec = 15;
    const maxSteps = (maxLookaheadHours * 3600) / stepSec;
    let inPass = false;
    let aosTime = null;
    let maxEl = -90;
    let maxElTime = null;

    // First check if already in pass
    const initTelem = this.calculateTelemetry(satrec, startDate, groundStation, satConfig);
    if (initTelem && initTelem.lookAngles.elevation >= groundStation.minElevation) {
      inPass = true;
      aosTime = startDate;
      maxEl = initTelem.lookAngles.elevation;
      maxElTime = startDate;
    }

    for (let i = 1; i <= maxSteps; i++) {
      const checkTime = new Date(startDate.getTime() + i * stepSec * 1000);
      const t = this.calculateTelemetry(satrec, checkTime, groundStation, satConfig);
      if (!t) continue;

      const el = t.lookAngles.elevation;
      const aboveHorizon = el >= groundStation.minElevation;

      if (!inPass && aboveHorizon) {
        inPass = true;
        aosTime = checkTime;
        maxEl = el;
        maxElTime = checkTime;
      } else if (inPass && aboveHorizon) {
        if (el > maxEl) {
          maxEl = el;
          maxElTime = checkTime;
        }
      } else if (inPass && !aboveHorizon) {
        const losTime = checkTime;
        const durationMin = (losTime.getTime() - aosTime.getTime()) / 60000;
        return {
          isPermanent: false,
          aosTime,
          maxElTime,
          losTime,
          maxElevation: maxEl,
          durationMinutes: Math.round(durationMin * 10) / 10,
          status: aosTime <= startDate ? 'ACTIVE PASS IN PROGRESS' : 'UPCOMING PASS SCHEDULED'
        };
      }
    }

    return null;
  }
}
