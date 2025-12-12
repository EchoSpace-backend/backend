// src/services/mapbox.service.js
const axios = require('axios');

const MAPBOX_KEY = process.env.MAPBOX_KEY || '';

/**
 * reverseGeocode(lng, lat)
 * returns place name string or empty string if not available
 */
async function reverseGeocode(lng, lat) {
  try {
    if (!MAPBOX_KEY) return '';
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;
    const res = await axios.get(url, {
      params: {
        access_token: MAPBOX_KEY,
        limit: 1
      },
      timeout: 5000
    });
    if (res.data && Array.isArray(res.data.features) && res.data.features.length > 0) {
      return res.data.features[0].place_name || '';
    }
    return '';
  } catch (err) {
    // fail silently — Mapbox optional
    console.warn('Mapbox reverse geocode failed:', err.message || err);
    return '';
  }
}

module.exports = { reverseGeocode };
