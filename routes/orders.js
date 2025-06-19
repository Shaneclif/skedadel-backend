const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Driver = require('../models/Driver');

// ✅ Create a new order and auto-assign to an online driver
router.post('/', async (req, res) => {
  try {
    const io = req.app.get('io');                      // get io instance from app
    const connectedDrivers = req.app.get('connectedDrivers'); // get map of driverId => socketId

    // Find first available online driver
    const onlineDriver = await Driver.findOne({ online: true });

    if (!onlineDriver) {
      return res.status(400).json({ error: 'No online driver available right now' });
    }

    // Create new order
    const order = new Order({
      ...req.body,
      assignedDriver: onlineDriver._id,
      status: 'assigned',
    });

    await order.save();

    // Emit new order to driver if they're connected
    const driverSocketId = connectedDrivers.get(onlineDriver._id.toString());
    if (driverSocketId) {
      io.to(driverSocketId).emit('newOrder', {
        orderId: order._id,
        pickup: order.pickupAddress,
        delivery: order.deliveryAddress,
        items: order.items,
        note: order.note || '',
      });
      console.log(`📦 Order ${order._id} pushed to driver ${onlineDriver._id}`);
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get all orders (admin use)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('assignedDriver', '-password');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Manually assign an order to a driver
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

// ✅ Update order status
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
