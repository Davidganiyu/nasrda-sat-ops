/**
 * Nigeria National & State Tactical Boundaries GeoJSON
 * GeoJSON FeatureCollection describing Nigeria sovereign border,
 * internal state boundaries, and FCT Abuja for tactical GIS visualization.
 */

export const NIGERIA_BOUNDARIES_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    // 1. National Sovereign Perimeter
    {
      type: 'Feature',
      properties: {
        name: 'Nigeria Sovereign National Border',
        boundaryType: 'national',
        description: 'Federal Republic of Nigeria Sovereign Border'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            // Atlantic Coastline (West to East)
            [2.720, 6.380], [3.400, 6.420], [4.300, 6.250], [5.100, 5.800],
            [5.600, 5.350], [5.950, 4.300], [6.850, 4.450], [7.550, 4.500],
            [8.300, 4.700], [8.550, 4.750],
            // Cameroon Border (South to North)
            [8.650, 5.100], [9.100, 5.850], [9.300, 6.350], [10.100, 6.800],
            [11.200, 6.950], [11.850, 7.300], [12.050, 8.100], [12.800, 8.900],
            [13.250, 9.300], [13.600, 10.050], [13.800, 10.900], [14.400, 11.750],
            [14.650, 12.350], [14.200, 13.050],
            // Lake Chad Basin / Chad Border
            [13.800, 13.500], [13.400, 13.750],
            // Niger Border (East to West)
            [12.850, 13.300], [12.000, 13.150], [11.100, 13.050], [10.250, 13.250],
            [9.400, 13.000], [8.500, 13.200], [7.700, 13.350], [7.100, 13.200],
            [6.200, 13.800], [5.400, 13.850], [4.500, 13.500], [3.800, 12.500],
            [3.600, 11.700],
            // Benin Republic Border (North to South)
            [3.650, 11.200], [3.700, 10.400], [3.400, 9.800], [3.200, 9.200],
            [2.800, 8.400], [2.700, 7.600], [2.700, 6.800], [2.720, 6.380]
          ]
        ]
      }
    },

    // National Perimeter Polyline Feature (for glowing line shader)
    {
      type: 'Feature',
      properties: {
        name: 'Nigeria National Border Vector',
        boundaryType: 'national'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [2.720, 6.380], [3.400, 6.420], [4.300, 6.250], [5.100, 5.800],
          [5.600, 5.350], [5.950, 4.300], [6.850, 4.450], [7.550, 4.500],
          [8.300, 4.700], [8.550, 4.750], [8.650, 5.100], [9.100, 5.850],
          [9.300, 6.350], [10.100, 6.800], [11.200, 6.950], [11.850, 7.300],
          [12.050, 8.100], [12.800, 8.900], [13.250, 9.300], [13.600, 10.050],
          [13.800, 10.900], [14.400, 11.750], [14.650, 12.350], [14.200, 13.050],
          [13.800, 13.500], [13.400, 13.750], [12.850, 13.300], [12.000, 13.150],
          [11.100, 13.050], [10.250, 13.250], [9.400, 13.000], [8.500, 13.200],
          [7.700, 13.350], [7.100, 13.200], [6.200, 13.800], [5.400, 13.850],
          [4.500, 13.500], [3.800, 12.500], [3.600, 11.700], [3.650, 11.200],
          [3.700, 10.400], [3.400, 9.800], [3.200, 9.200], [2.800, 8.400],
          [2.700, 7.600], [2.700, 6.800], [2.720, 6.380]
        ]
      }
    },

    // 2. FCT Abuja Perimeter (Federal Capital Territory)
    {
      type: 'Feature',
      properties: {
        name: 'Federal Capital Territory (FCT Abuja)',
        boundaryType: 'fct'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [7.000, 9.280], [7.620, 9.280], [7.680, 8.900], [7.550, 8.450],
          [7.050, 8.450], [6.850, 8.850], [7.000, 9.280]
        ]
      }
    },

    // 3. North-West Regional Boundaries (Sokoto, Kebbi, Zamfara, Katsina, Kano, Kaduna)
    {
      type: 'Feature',
      properties: {
        name: 'Sokoto - Kebbi - Zamfara Partition',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.800, 11.700], [4.400, 12.000], [5.200, 12.500], [5.800, 13.400]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Kebbi - Niger Border',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.600, 11.300], [4.200, 11.000], [4.800, 10.800], [5.200, 10.200]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Zamfara - Kaduna - Katsina Partition',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [6.000, 11.200], [6.800, 11.500], [7.400, 12.000], [7.700, 13.000]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Kano - Jigawa - Katsina Border',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [7.800, 11.500], [8.400, 12.000], [8.800, 12.800], [9.400, 13.000]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Kaduna - Kano - Plateau Border',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [7.200, 10.400], [8.000, 10.700], [8.800, 11.200], [9.200, 11.500]
        ]
      }
    },

    // 4. North-East Regional Boundaries (Borno, Yobe, Bauchi, Gombe, Adamawa, Taraba)
    {
      type: 'Feature',
      properties: {
        name: 'Yobe - Borno Northern Corridor',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [11.500, 13.050], [12.000, 12.300], [12.400, 11.500], [12.800, 11.000]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Bauchi - Gombe - Yobe Border',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [9.500, 11.800], [10.200, 11.200], [11.100, 10.800], [11.600, 10.200]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Gombe - Adamawa - Borno Partition',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [11.100, 10.800], [11.800, 10.500], [12.500, 10.300], [13.200, 10.200]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Taraba - Adamawa Mountain Line',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [10.500, 8.800], [11.200, 8.500], [11.800, 8.200], [12.050, 8.100]
        ]
      }
    },

    // 5. North-Central / Middle Belt (Niger, Kwara, Kogi, Benue, Plateau, Nasarawa)
    {
      type: 'Feature',
      properties: {
        name: 'Niger State - Kaduna - FCT Border',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [5.200, 10.200], [6.200, 9.800], [7.000, 9.300], [7.500, 9.800]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'River Niger Axis (Kwara - Niger - Kogi)',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.800, 9.500], [4.600, 9.000], [5.600, 8.600], [6.740, 7.800]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'River Benue Axis (Kogi - Benue - Nasarawa - Taraba)',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [6.740, 7.800], [7.600, 7.800], [8.500, 7.900], [9.600, 8.400], [10.500, 8.800]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Plateau - Nasarawa - Bauchi Divide',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [8.200, 9.500], [8.800, 9.200], [9.500, 9.800], [10.200, 9.500]
        ]
      }
    },

    // 6. South-West Regional Boundaries (Lagos, Ogun, Oyo, Osun, Ondo, Ekiti)
    {
      type: 'Feature',
      properties: {
        name: 'Lagos - Ogun Coastal Perimeter',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [2.700, 6.450], [3.200, 6.650], [3.600, 6.600], [4.200, 6.450]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Ogun - Oyo - Osun Corridor',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.000, 7.200], [3.600, 7.400], [4.200, 7.600], [4.600, 7.800]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Oyo - Kwara Northern Divide',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.000, 8.200], [3.800, 8.400], [4.500, 8.600]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Ondo - Ekiti - Osun - Edo Border',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.600, 7.800], [5.100, 7.600], [5.600, 7.200], [5.800, 6.400]
        ]
      }
    },

    // 7. South-East & South-South Niger Delta (Edo, Delta, Bayelsa, Rivers, Akwa Ibom, Cross River, Anambra, Enugu, Ebonyi, Imo, Abia)
    {
      type: 'Feature',
      properties: {
        name: 'Edo - Delta - Ondo Partition',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [5.400, 6.800], [5.800, 6.200], [6.200, 5.800], [5.600, 5.350]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Anambra - Enugu - Ebonyi - Kogi Border',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [6.800, 7.200], [7.300, 6.800], [7.800, 6.600], [8.200, 6.400]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Imo - Abia - Rivers - Delta Delta Grid',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [6.400, 5.800], [6.900, 5.500], [7.400, 5.200], [7.550, 4.500]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Akwa Ibom - Cross River - Cameroon Border Axis',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [7.600, 5.100], [8.000, 5.400], [8.400, 5.800], [8.800, 6.200], [9.300, 6.350]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Benue - Cross River - Ebonyi Divide',
        boundaryType: 'state'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [8.000, 6.800], [8.500, 6.600], [9.000, 6.800], [9.600, 7.200]
        ]
      }
    }
  ]
};
