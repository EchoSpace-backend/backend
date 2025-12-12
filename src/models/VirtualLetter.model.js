// src/models/VirtualLetter.model.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const MediaSchema = new Schema({
  filename: { type: String },
  originalname: { type: String },
  mimetype: { type: String },
  size: { type: Number },
  url: { type: String }
}, { _id: false });

const VirtualLetterSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, default: null }, // optional for public API
  content: { type: String, required: true, trim: true },
  media: { type: [MediaSchema], default: [] },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  placeName: { type: String, default: '' },
  visibility: { type: String, enum: ['public', 'circle', 'private'], default: 'public' },
  createdAt: { type: Date, default: Date.now }
});

// Geospatial index
VirtualLetterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('VirtualLetter', VirtualLetterSchema);
