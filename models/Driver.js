const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['car', 'bike', 'van'],
    default: 'car'
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  avatarUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Active', 'Offline'],
    default: 'Offline'
  },
  location: {
    lat: Number,
    lng: Number,
    lastUpdated: Date
  },
  online: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Driver', DriverSchema);
