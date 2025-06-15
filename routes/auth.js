const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');

// Driver Registration
router.post('/register', async (req, res) => {
  const { name, phone, email, password, vehicleType } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newDriver = new Driver({
      name,
      phone,
      email,
      password: hashedPassword,
      vehicleType
    });
    await newDriver.save();
    res.status(201).json({ message: "Driver registered successfully!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Driver Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const driver = await Driver.findOne({ email });
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: driver._id, type: 'driver' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, driver });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
