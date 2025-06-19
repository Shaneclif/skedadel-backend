const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  customerName: String,
  customerPhone: String,
  restaurant: String, // e.g. KFC Sandton
  pickupAddress: String,
  pickupLat: Number,
  pickupLng: Number,
  dropoffAddress: String,
  deliveryLat: Number,
  deliveryLng: Number,
  note: String, // optional instructions
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  items: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
