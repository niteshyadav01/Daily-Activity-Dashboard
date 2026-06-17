const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');

// GET /settings — all settings
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.find();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /settings/:key
router.get('/:key', async (req, res) => {
  try {
    const setting = await Setting.findOne({ setting_key: req.params.key });
    if (!setting) return res.status(404).json({ error: 'Setting not found' });
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /settings/:key — upsert
router.put('/:key', async (req, res) => {
  try {
    const { setting_value } = req.body;
    if (setting_value === undefined) {
      return res.status(400).json({ error: 'setting_value required' });
    }

    await Setting.findOneAndUpdate(
      { setting_key: req.params.key },
      { setting_value },
      { upsert: true, new: true }
    );

    res.json({ message: 'Setting updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
