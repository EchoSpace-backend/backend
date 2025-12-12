// src/controllers/virtualLetter.controller.js
const VirtualLetter = require('../models/VirtualLetter.model');
const { reverseGeocode } = require('../services/mapbox.service');
const ApiResponse = require('../utils/ApiResponse');
const path = require('path');

const DEFAULT_RADIUS_METERS = 100; // default search radius

/**
 * Create a new virtual letter
 * - expects content, latitude, longitude in body (multipart/form-data or json).
 * - optional media files (field name: media)
 */
async function createLetter(req, res, next) {
  try {
    // content, latitude, longitude may be in either body or form data
    const { content } = req.body;
    const lat = parseFloat(req.body.latitude ?? req.body.lat);
    const lng = parseFloat(req.body.longitude ?? req.body.lng);

    if (!content || Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json(ApiResponse.error('content, latitude and longitude are required'));
    }

    // Process uploaded files (if any)
    const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
    const media = files.map(f => ({
      filename: f.filename,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      url: `${req.protocol}://${req.get('host')}/uploads/${f.filename}`
    }));

    // Reverse geocode (optional)
    const placeName = await reverseGeocode(lng, lat);

    // normalize visibility input to allowed enum values
    const rawVis = (req.body.visibility || 'public').toString().trim().toLowerCase();
    let visibility = 'public';
    if (rawVis.startsWith('public')) visibility = 'public';
    else if (rawVis.startsWith('circle')) visibility = 'circle';
    else if (rawVis.startsWith('private')) visibility = 'private';

    const letter = new VirtualLetter({
      content,
      media,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      placeName,
      visibility
    });

    const saved = await letter.save();
    return res.status(201).json(ApiResponse.success(saved, 'Virtual letter created'));
  } catch (err) {
    next(err);
  }
}

/**
 * Get letters near a location
 * Query params: lat, lng, radius (meters, optional), limit (optional)
 */
async function getNearbyLetters(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat ?? req.query.latitude);
    const lng = parseFloat(req.query.lng ?? req.query.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json(ApiResponse.error('lat and lng query parameters are required'));
    }

    const radiusMeters = parseInt(req.query.radius || DEFAULT_RADIUS_METERS, 10);
    const limit = Math.min(parseInt(req.query.limit || 50, 10), 100);

    // $geoNear requires an index; use aggregation with $geoNear to also return distance
    const aggregation = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          spherical: true,
          maxDistance: radiusMeters, // in meters
          query: { visibility: 'public' }
        }
      },
      { $sort: { distanceMeters: 1, createdAt: -1 } },
      { $limit: limit }
    ];

    const results = await VirtualLetter.aggregate(aggregation);

    return res.json(ApiResponse.success(results, `Found ${results.length} letters within ${radiusMeters} meters`));
  } catch (err) {
    next(err);
  }
}

/**
 * Get letter by ID
 */
async function getLetterById(req, res, next) {
  try {
    const { id } = req.params;
    const letter = await VirtualLetter.findById(id);
    if (!letter) return res.status(404).json(ApiResponse.error('Letter not found'));
    return res.json(ApiResponse.success(letter));
  } catch (err) {
    next(err);
  }
}

/**
 * Delete letter by ID (developer/admin)
 */
async function deleteLetter(req, res, next) {
  try {
    const { id } = req.params;
    const removed = await VirtualLetter.findByIdAndDelete(id);
    if (!removed) return res.status(404).json(ApiResponse.error('Letter not found'));
    return res.json(ApiResponse.success(removed, 'Letter deleted'));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createLetter,
  getNearbyLetters,
  getLetterById,
  deleteLetter
};
