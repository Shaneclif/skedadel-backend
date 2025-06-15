const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Driver = require('../models/Driver');

// Create a new order
router.post('/', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all orders (admin use)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('assignedDriver', '-password');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign an order to a driver
router.put('/:id/assign', async (req, res) => {
  const { driverId } = req.body;
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { assignedDriver: driverId, status: 'assigned' },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status (driver use)
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
