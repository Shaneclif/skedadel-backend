// models/DriverLocation.js
const mongoose = require('mongoose');

const driverLocationSchema = new mongoose.Schema({
  driverId: { type: String, required: true, unique: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DriverLocation', driverLocationSchema);
