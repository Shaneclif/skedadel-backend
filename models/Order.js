const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  restaurant: {
    type: String,
    required: true,
    trim: true
  },
  pickupAddress: {
    type: String,
    required: true,
    trim: true
  },
  pickupLat: {
    type: Number,
    required: true
  },
  pickupLng: {
    type: Number,
    required: true
  },
  deliveryAddress: { // ✅ Fixed: was dropoffAddress
    type: String,
    required: true,
    trim: true
  },
  deliveryLat: {
    type: Number,
    required: true
  },
  deliveryLng: {
    type: Number,
    required: true
  },
  pickupInstructions: { // ✅ Added
    type: String,
    default: ''
  },
  deliveryInstructions: { // ✅ Added
    type: String,
    default: ''
  },
  items: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Optional: Auto-update `updatedAt` on save
OrderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
