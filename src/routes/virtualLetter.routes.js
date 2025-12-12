// src/routes/virtualLetter.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createLetter,
  getNearbyLetters,
  getLetterById,
  deleteLetter
} = require('../controllers/virtualLetter.controller');

// prepare uploads folder
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer storage config (disk)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // unique filename: timestamp-originalname
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    const filename = `${Date.now()}-${base}${ext}`;
    cb(null, filename);
  }
});

const maxSize = parseInt(process.env.MAX_UPLOAD_FILE_SIZE || '52428800', 10); // 50MB default
const upload = multer({ storage, limits: { fileSize: maxSize } });

// Routes

// Create letter (supports multiple media files via 'media' field)
router.post('/', upload.array('media', 5), createLetter);

// Get letters near a location (lat, lng required). Example: /nearby?lat=12.9&lng=77.5&radius=200
router.get('/nearby', getNearbyLetters);

// Get by id
router.get('/:id', getLetterById);

// Delete by id (no auth) - developer endpoint
router.delete('/:id', deleteLetter);

module.exports = router;
