/**
 * Two-Line Element (TLE) Fetcher & Cache Service
 * Queries CelesTrak GP API with local storage caching and instant offline fallback.
 */

import { SATELLITE_CATALOG } from '../config/satellites.js';

const CACHE_KEY_PREFIX = 'nasrda_sat_tle_';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours cache

export class TleService {
  /**
   * Fetch latest TLE for a satellite
   * @param {Object} satelliteConfig Satellite catalog object
   * @returns {Promise<{line1: string, line2: string, name: string, isLive: boolean, timestamp: string}>}
   */
  static async getTle(satelliteConfig) {
    const noradId = satelliteConfig.noradId;
    const cacheKey = `${CACHE_KEY_PREFIX}${noradId}`;
    
    // If planned mission, return the official simulated TLE directly without delay
    if (satelliteConfig.launchDate && satelliteConfig.launchDate.includes('PLANNED')) {
      return {
        name: satelliteConfig.name,
        line1: satelliteConfig.defaultTle.line1,
        line2: satelliteConfig.defaultTle.line2,
        isLive: false,
        timestamp: new Date().toISOString(),
        source: 'FEC Planned Constellation Catalog'
      };
    }

    // Check cached TLE
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - (parsed.cachedAt || 0);
        if (age < CACHE_TTL_MS && parsed.line1 && parsed.line2) {
          console.log(`[TLE] Loaded cached TLE for ${satelliteConfig.name} (${Math.round(age / 60000)}m old)`);
          return {
            name: satelliteConfig.name,
            line1: parsed.line1,
            line2: parsed.line2,
            isLive: true,
            timestamp: new Date(parsed.cachedAt).toISOString(),
            source: 'CelesTrak (Cached)'
          };
        }
      }
    } catch (e) {
      console.warn('[TLE] LocalStorage read error:', e);
    }

    // Attempt live fetch from CelesTrak
    const celestrakUrls = [
      `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`)}`
    ];

    for (const url of celestrakUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);

          let line1 = null;
          let line2 = null;
          let name = satelliteConfig.name;

          if (lines.length >= 3) {
            name = lines[0];
            line1 = lines[1];
            line2 = lines[2];
          } else if (lines.length >= 2) {
            line1 = lines[0];
            line2 = lines[1];
          }

          if (line1 && line2 && line1.startsWith('1 ') && line2.startsWith('2 ')) {
            // Save to cache
            try {
              localStorage.setItem(cacheKey, JSON.stringify({
                line1,
                line2,
                cachedAt: Date.now()
              }));
            } catch (err) {
              console.warn('[TLE] LocalStorage write error:', err);
            }

            console.log(`[TLE] Successfully retrieved live TLE for ${satelliteConfig.name} from CelesTrak`);
            return {
              name,
              line1,
              line2,
              isLive: true,
              timestamp: new Date().toISOString(),
              source: 'CelesTrak Live GP'
            };
          }
        }
      } catch (err) {
        console.warn(`[TLE] Fetch failed for ${url}:`, err.message);
      }
    }

    // Fallback to verified catalog TLE
    console.log(`[TLE] Using verified offline catalog TLE for ${satelliteConfig.name}`);
    return {
      name: satelliteConfig.name,
      line1: satelliteConfig.defaultTle.line1,
      line2: satelliteConfig.defaultTle.line2,
      isLive: false,
      timestamp: new Date().toISOString(),
      source: 'NASRDA Offline Catalog'
    };
  }
}
