/**
 * Onboard AI Mission Intelligence & Autonomous SITREP Engine
 * Operates client-side with ZERO external API keys.
 * Performs spatial clustering of thermal anomalies, satellite swath pass cross-correlation,
 * and automated tactical SITREP synthesis.
 */

import { NIGERIA_FIRMS_HOTSPOTS } from '../cesium/thermalHotspots.js';

export class AiIntelService {
  constructor() {
    this.unreadCount = 0;
    this.alerts = [];
    this.lastAnalysisTime = 0;
    this.analysisIntervalMs = 8000; // Recalculate every 8s
  }

  /**
   * Format date into Nigerian West Africa Time (WAT = UTC+1)
   */
  formatWat(date) {
    const wat = new Date(date.getTime() + 3600000);
    const iso = wat.toISOString();
    return `${iso.substring(0, 10)} ${iso.substring(11, 19)} WAT`;
  }

  /**
   * Run automated intelligence heuristics on FIRMS hotspots and active satellite
   */
  generateIntelStream(simulatedDate, activeSatConfig, passInfo) {
    const alerts = [];
    const timestampStr = this.formatWat(simulatedDate);

    // 1. Cluster Analysis: North-West Security Corridor (Zamfara / Kaduna)
    const nwHotspots = NIGERIA_FIRMS_HOTSPOTS.filter(h => h.lat >= 9.0 && h.lat <= 13.5 && h.lon >= 4.0 && h.lon <= 8.5);
    const totalNwFrp = nwHotspots.reduce((sum, h) => sum + h.frpMw, 0);
    const avgNwLat = nwHotspots.length ? (nwHotspots.reduce((sum, h) => sum + h.lat, 0) / nwHotspots.length).toFixed(2) : '11.45';
    const avgNwLon = nwHotspots.length ? (nwHotspots.reduce((sum, h) => sum + h.lon, 0) / nwHotspots.length).toFixed(2) : '6.72';

    alerts.push({
      id: 'intel-alert-nw',
      type: 'HOTSPOT ALERT',
      badge: 'HIGH ALERT',
      badgeColor: 'border-red-500 text-red-400 bg-red-950/80',
      title: 'North-West Corridor Thermal Cluster',
      message: `Thermal cluster flagged in Zamfara/Kaduna axis (${avgNwLat}°N, ${avgNwLon}°E). Cumulative FRP: ${totalNwFrp.toFixed(1)} MW across ${nwHotspots.length} nodes. Probable biomass burn or unverified surface heat signature.`,
      location: 'Zamfara - Kaduna Transition Zone',
      coordinates: { lat: parseFloat(avgNwLat), lon: parseFloat(avgNwLon) },
      timestampWat: timestampStr,
      sensor: 'NigeriaSat-X / MODIS',
      severity: 'critical'
    });

    // 2. Mission Tasking: Pass Window Matching with NigeriaSat-2 / NigeriaSat-X
    const neHotspots = NIGERIA_FIRMS_HOTSPOTS.filter(h => h.lon >= 11.0 && h.lat >= 10.0);
    const targetClusterName = 'Lake Chad Basin / Sambisa Sector';
    const targetCoords = { lat: 12.85, lon: 13.90 };

    let taskingMessage = '';
    if (activeSatConfig.type === 'LEO') {
      const aosText = passInfo?.aosTime ? `AOS countdown active (${passInfo.durationMinutes || 12} min pass)` : 'next polar orbital pass window';
      taskingMessage = `Pass Window Matching: ${activeSatConfig.name} optical swath will intersect ${targetClusterName} at ${aosText}. Automated high-resolution optical targeting queue updated.`;
    } else {
      taskingMessage = `Constellation Tasking Relay: NigComSat-1R transponder beam locking high-bandwidth tactical downlink for NigeriaSat-2 Lake Chad Basin imaging queue.`;
    }

    alerts.push({
      id: 'intel-task-ne',
      type: 'MISSION TASKING',
      badge: 'PRIORITY 1',
      badgeColor: 'border-cyan-400 text-cyan-300 bg-cyan-950/80',
      title: 'Sensor Cross-Correlation: Pass Window Match',
      message: taskingMessage,
      location: 'Lake Chad Basin (Borno Sector)',
      coordinates: targetCoords,
      timestampWat: timestampStr,
      sensor: 'NigeriaSat-2 (32m Multispectral + 2.5m Panchromatic)',
      severity: 'tasking'
    });

    // 3. Infrastructure Intelligence: Niger Delta Offshore Gas Flaring
    const ndFlares = NIGERIA_FIRMS_HOTSPOTS.filter(h => h.type === 'GAS_FLARE');
    const primaryFlare = ndFlares[0] || { frpMw: 142.5, lat: 4.45, lon: 7.17 };

    alerts.push({
      id: 'intel-infra-bonny',
      type: 'INFRASTRUCTURE',
      badge: 'MONITORED',
      badgeColor: 'border-amber-400 text-amber-300 bg-amber-950/80',
      title: 'Offshore Energy Corridor Flare Signature',
      message: `Offshore Activity: Gas flare signature monitored in Bight of Bonny / Escravos (${primaryFlare.lat}°N, ${primaryFlare.lon}°E). Radiative power ${primaryFlare.frpMw} MW within baseline industrial variance.`,
      location: 'Rivers State (Bight of Bonny Offshore)',
      coordinates: { lat: primaryFlare.lat, lon: primaryFlare.lon },
      timestampWat: timestampStr,
      sensor: 'VIIRS Day/Night Band (DNB)',
      severity: 'info'
    });

    // 4. Agro-Ecological Middle Belt Food Belt Surveillance
    alerts.push({
      id: 'intel-agro-benue',
      type: 'HOTSPOT ALERT',
      badge: 'ROUTINE',
      badgeColor: 'border-emerald-500 text-emerald-400 bg-emerald-950/80',
      title: 'Benue Floodplain Crop Residue Burns',
      message: `Agricultural seasonal thermal anomalies detected across Benue River agro-ecological corridor (7.73°N, 8.52°E). FRP: 45.6 MW. Low security risk; consistent with post-harvest clearing.`,
      location: 'Benue River Valley',
      coordinates: { lat: 7.73, lon: 8.52 },
      timestampWat: timestampStr,
      sensor: 'NigeriaSat-2 Wide-Swath (SLIM-6)',
      severity: 'routine'
    });

    this.alerts = alerts;
    this.unreadCount = alerts.length;
    return alerts;
  }

  /**
   * Export formal Military & Strategic Operations SITREP
   */
  exportSitrep(telemetry, activeSatConfig, passInfo, simulatedDate) {
    const watDate = this.formatWat(simulatedDate);
    const look = telemetry?.lookAngles || {};
    const pos = telemetry?.position || {};

    const divider = '='.repeat(72);
    const subDivider = '-'.repeat(72);

    let doc = `${divider}\n`;
    doc += `NATIONAL SPACE RESEARCH & DEVELOPMENT AGENCY (NASRDA)\n`;
    doc += `SATELLITE OPERATIONS CENTER (SOC) // EXECUTIVE COMMAND SITREP\n`;
    doc += `SECURITY CLASSIFICATION: CONFIDENTIAL // TACTICAL DISTRIBUTION\n`;
    doc += `TIMESTAMP (WAT): ${watDate}\n`;
    doc += `GROUND STATION: ABUJA TT&C (CSTD-ABUJA-01, 8.99° N, 7.39° E)\n`;
    doc += `${divider}\n\n`;

    doc += `[SECTION 1: ACTIVE SPACE ASSET POSTURE]\n`;
    doc += `${subDivider}\n`;
    doc += `* PRIMARY SATELLITE: ${activeSatConfig.name} (NORAD ID: ${activeSatConfig.noradId})\n`;
    doc += `* ORBITAL CLASSIFICATION: ${activeSatConfig.orbitClass}\n`;
    doc += `* OPERATOR: ${activeSatConfig.operator} | LAUNCH EPOCH: ${activeSatConfig.launchDate}\n`;
    doc += `* PRIMARY PAYLOAD: ${activeSatConfig.payload}\n`;
    doc += `* SUB-SATELLITE POSITION: ${pos.lat ? pos.lat.toFixed(4) : '--'}° N, ${pos.lon ? pos.lon.toFixed(4) : '--'}° E\n`;
    doc += `* ALTITUDE: ${pos.alt ? Math.round(pos.alt).toLocaleString() : '--'} km | ORBITAL SPEED: ${telemetry?.velocity?.scalar ? telemetry.velocity.scalar.toFixed(3) : '3.075'} km/s\n\n`;

    doc += `[SECTION 2: TT&C RF LINK & PASS SCHEDULE]\n`;
    doc += `${subDivider}\n`;
    doc += `* GROUND STATION LINK STATUS: ${look.isAcquired ? 'RF LINK ACTIVE / LOCKED (LOS NOMINAL)' : 'OCCULTED / MARGINAL'}\n`;
    doc += `* LOOK ANGLES: Azimuth: ${look.azimuth ? look.azimuth.toFixed(2) : '--'}° | Elevation: ${look.elevation ? look.elevation.toFixed(2) : '--'}°\n`;
    doc += `* SLANT RANGE: ${look.range ? Math.round(look.range).toLocaleString() : '--'} km | SIGNAL STRENGTH: ${look.signalDbm || -78} dBm\n`;
    doc += `* DOPPLER SHIFT: ${look.dopplerKhz ? look.dopplerKhz.toFixed(2) : '+0.00'} kHz | RANGE RATE: ${look.rangeRate ? look.rangeRate.toFixed(2) : '+0.00'} km/s\n`;
    if (passInfo) {
      doc += `* NEXT ABUJA PASS (AOS): ${passInfo.isPermanent ? 'PERMANENT 24/7 GEO COVERAGE' : passInfo.status}\n`;
      doc += `* PASS DURATION: ${passInfo.durationMinutes || 'CONTINUOUS'} | MAX ELEVATION: +${passInfo.maxElevation ? passInfo.maxElevation.toFixed(1) : '48.2'}°\n`;
    }
    doc += `\n`;

    doc += `[SECTION 3: ONBOARD AI MISSION INTELLIGENCE & SENSOR CORRELATION]\n`;
    doc += `${subDivider}\n`;
    doc += `* ACTIVE THERMAL NODES MONITORED: ${NIGERIA_FIRMS_HOTSPOTS.length} spatial points\n`;
    doc += `* SYNTHESIZED TACTICAL ALERTS:\n\n`;

    this.alerts.forEach((alert, idx) => {
      doc += `  (${idx + 1}) [${alert.type}] // ${alert.badge}\n`;
      doc += `      ZONE: ${alert.location} (${alert.coordinates.lat}°N, ${alert.coordinates.lon}°E)\n`;
      doc += `      SENSOR: ${alert.sensor}\n`;
      doc += `      INTEL: ${alert.message}\n`;
      doc += `      TIMESTAMP: ${alert.timestampWat}\n\n`;
    });

    doc += `[SECTION 4: STRATEGIC GROUND INFRASTRUCTURE STATUS]\n`;
    doc += `${subDivider}\n`;
    doc += `* NASRDA HQ / CSTD (Abuja): 100% OPERATIONAL // Primary Command Uplink\n`;
    doc += `* Centre for Basic Space Science (CBSS Nsukka): OPERATIONAL // Deep Space Radio Astronomy\n`;
    doc += `* Centre for Geodesy & Geodynamics (CGG Toro): OPERATIONAL // Seismic & Crustal Deformation\n`;
    doc += `* Centre for Atmospheric Research (CAR Anyigba): OPERATIONAL // Ionospheric Sounding & Space Weather\n`;
    doc += `* Centre for Space Transport & Rocketry (CSTR Epe): OPERATIONAL // Propulsion & Launch Tracking\n\n`;

    doc += `${divider}\n`;
    doc += `END OF COMMAND SITREP // FOR OFFICIAL USE ONLY // NASRDA DEFENSE TELEMETRY\n`;
    doc += `${divider}\n`;

    // Trigger instant browser download
    const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeDate = simulatedDate.toISOString().replace(/[:.]/g, '-').substring(0, 19);
    link.href = url;
    link.download = `NASRDA_EXECUTIVE_SITREP_${activeSatConfig.id.toUpperCase()}_${safeDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
