const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const bcrypt = require('bcrypt');

// Get all drivers (admin use)
router.get('/', async (req, res) => {
  try {
    const drivers = await Driver.find().select('-password');
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single driver by ID
router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).select('-password');
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update driver location (manual location update - not used for live tracking)
router.put('/:id/location', async (req, res) => {
  const { lat, lng } = req.body;
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { location: { lat, lng, lastUpdated: new Date() } },
      { new: true }
    );
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new driver with hashed password
router.post('/', async (req, res) => {
  try {
    console.log("Incoming driver data:", req.body);
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
      isActive: isActive !== undefined ? isActive : true
    });

    await newDriver.save();
    res.status(201).json({ message: "Driver created successfully" });
  } catch (err) {
    console.error("❌ Error creating driver:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Driver login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const driver = await Driver.findOne({ email });

    if (!driver) return res.status(404).json({ message: "Driver not found" });

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    res.status(200).json({ message: "Login successful", driverId: driver._id });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔴 Live location tracking endpoint
router.post('/location', async (req, res) => {
  try {
    const { driverId, latitude, longitude, timestamp } = req.body;

    if (!driverId || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing location data" });
    }

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      {
        location: {
          lat: latitude,
          lng: longitude,
          lastUpdated: timestamp || new Date()
        }
      },
      { new: true }
    );

    if (!driver) return res.status(404).json({ message: "Driver not found" });

    res.json({ success: true, message: "Location updated", location: driver.location });
  } catch (err) {
    console.error("❌ Location update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Get all driver locations (admin map)
router.get('/locations', async (req, res) => {
  try {
    const drivers = await Driver.find({
      'location.lat': { $exists: true },
      'location.lng': { $exists: true }
    }).select('name location vehicleType');

    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});


module.exports = router;
