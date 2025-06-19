const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Driver = require('../models/Driver');

// ✅ Create a new order and auto-assign to an online driver
router.post('/', async (req, res) => {
  try {
    const io = req.app.get('io');
    const connectedDrivers = req.app.get('connectedDrivers');

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

    // 🔄 Populate the assignedDriver before sending to client
    const fullOrder = await Order.findById(order._id).populate('assignedDriver', '-password');

    // 🎯 Emit full order to connected driver
    const driverSocketId = connectedDrivers.get(onlineDriver._id.toString());
    if (driverSocketId) {
      io.to(driverSocketId).emit('newOrder', fullOrder);
      console.log(`📦 Order ${order._id} emitted to driver ${onlineDriver._id} via socket`);
    } else {
      console.log(`⚠️ Driver ${onlineDriver._id} is not connected via socket`);
    }

    res.status(201).json(fullOrder);
  } catch (err) {
    console.error("❌ Error creating order:", err);
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
    ).populate('assignedDriver', '-password');

    // Send order update to driver if connected
    const io = req.app.get('io');
    const connectedDrivers = req.app.get('connectedDrivers');
    const socketId = connectedDrivers.get(driverId);
    if (socketId) {
      io.to(socketId).emit('newOrder', order);
      console.log(`📦 Order ${order._id} manually assigned and emitted to ${driverId}`);
    }

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
