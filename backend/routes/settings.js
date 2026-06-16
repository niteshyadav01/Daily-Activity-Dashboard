const express = require('express');
const db = require('../DB');
const router = express.Router();

// Get all settings
router.get('/', (req, res) => {
  db.all('SELECT * FROM settings', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Get single setting
router.get('/:key', (req, res) => {
  db.get(
    'SELECT * FROM settings WHERE setting_key = ?',
    [req.params.key],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Setting not found' });
      res.json(row);
    }
  );
});

// Update setting
router.put('/:key', (req, res) => {
  const { setting_value } = req.body;

  if (setting_value === undefined) {
    return res.status(400).json({ error: 'setting_value required' });
  }

  db.run(
    `UPDATE settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE setting_key = ?`,
    [setting_value, req.params.key],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        // Insert if not exists
        db.run(
          `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)`,
          [req.params.key, setting_value],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Setting updated' });
          }
        );
      } else {
        res.json({ message: 'Setting updated' });
      }
    }
  );
});

module.exports = router;
