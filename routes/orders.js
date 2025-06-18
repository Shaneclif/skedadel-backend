const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Driver = require('../models/Driver');

// ✅ Create a new order and auto-assign to an online driver
router.post('/', async (req, res) => {
  try {
    // Find first available online driver
    const onlineDriver = await Driver.findOne({ online: true });

    if (!onlineDriver) {
      return res.status(400).json({ error: 'No online driver available right now' });
    }

    // Attach driver and status to order
    const order = new Order({
      ...req.body,
      assignedDriver: onlineDriver._id,
      status: 'assigned',
    });

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

// Manually assign order to a driver
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

// Update order status (e.g. picked up, delivered)
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
