// src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const virtualLetterRoutes = require('./routes/virtualLetter.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads as static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/letters', virtualLetterRoutes);

// Health check
app.get('/health', (req, res) => res.json({ ok: true, timestamp: Date.now() }));

// Error handler (should be last)
app.use(errorHandler);

module.exports = app;
