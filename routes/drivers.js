const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const bcrypt = require('bcrypt');

// 1. Live driver locations for admin map
router.get('/locations', async (req, res) => {
  try {
    const drivers = await Driver.find({
      'location.lat': { $exists: true },
      'location.lng': { $exists: true }
    }).select('name phone location vehicleType taskCount online');

    const processed = drivers.map(d => ({
      ...d._doc,
      taskCount: d.taskCount || 0,
      online: !!d.online
    }));

    res.json(processed);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// 2. Get all drivers
router.get('/', async (req, res) => {
  try {
    const drivers = await Driver.find().select('-password');
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get single driver
router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).select('-password');
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Manual location update
router.put('/:id/location', async (req, res) => {
  const { lat, lng } = req.body;
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        location: { lat, lng, lastUpdated: new Date() },
        online: true
      },
      { new: true }
    );
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Register new driver
router.post('/', async (req, res) => {
  try {
    const { username, name, phone, email, password, vehicleType, isActive } = req.body;
    if (!username || !email || !password || !name || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await Driver.findOne({ $or: [{ email }, { phone }, { username }] });
    if (existing) {
      return res.status(400).json({ message: "Driver already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newDriver = new Driver({
      username,
      name,
      phone,
      email,
      password: hashedPassword,
      vehicleType,
      isActive: isActive !== undefined ? isActive : true,
      taskCount: 0,
      online: false
    });

    await newDriver.save();
    res.status(201).json({ message: "Driver created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 6. Driver login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const driver = await Driver.findOne({ email });
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    res.status(200).json({ message: "Login successful", driverId: driver._id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 7. Unified tracking + status route
router.post('/status', async (req, res) => {
  try {
    const { driverId, status, latitude, longitude, timestamp } = req.body;
    if (!driverId || !status) {
      return res.status(400).json({ message: "Missing driverId or status" });
    }

    const update = {
      online: status.toLowerCase() === 'online'
    };

    if (latitude && longitude) {
      update.location = {
        lat: latitude,
        lng: longitude,
        lastUpdated: timestamp || new Date()
      };
    } else if (status.toLowerCase() === 'offline') {
      update.location = null; // Clear GPS on offline
    }

    const driver = await Driver.findByIdAndUpdate(driverId, update, { new: true });
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    res.json({ success: true, online: driver.online });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
