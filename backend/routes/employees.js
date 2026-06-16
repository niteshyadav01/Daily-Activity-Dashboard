const express = require('express');
const db = require('../DB');
const router = express.Router();

// Get all employees with pagination
router.get('/', (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const department = req.query.department;
  const search = req.query.search;

  let query = 'SELECT * FROM employees WHERE 1=1';
  const params = [];

  if (department && department !== 'all') {
    query += ' AND department = ?';
    params.push(department);
  }

  if (search) {
    query += ' AND employee_name LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY created_at DESC';

  // Get total count
  db.get(query.replace('SELECT *', 'SELECT COUNT(*) as count'), params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        data: rows,
        pagination: {
          page,
          limit,
          total: countResult.count,
          totalPages: Math.ceil(countResult.count / limit)
        }
      });
    });
  });
});

// Get single employee
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM employees WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Employee not found' });
    res.json(row);
  });
});

// Create employee
router.post('/', (req, res) => {
  const { employee_name, department } = req.body;

  if (!employee_name || !department) {
    return res.status(400).json({ error: 'Name and department required' });
  }

  db.run(
    'INSERT INTO employees (employee_name, department) VALUES (?, ?)',
    [employee_name, department],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Employee already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, employee_name, department });
    }
  );
});

// Update employee
router.put('/:id', (req, res) => {
  const { employee_name, department, active } = req.body;
  const params = [];
  let query = 'UPDATE employees SET';

  if (employee_name !== undefined) {
    query += ' employee_name = ?,';
    params.push(employee_name);
  }
  if (department !== undefined) {
    query += ' department = ?,';
    params.push(department);
  }
  if (active !== undefined) {
    query += ' active = ?,';
    params.push(active ? 1 : 0);
  }

  query = query.slice(0, -1); // Remove trailing comma
  query += ' WHERE id = ?';
  params.push(req.params.id);

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee updated' });
  });
});

// Delete employee
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM employees WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  });
});

// Disable employee (soft delete)
router.patch('/:id/disable', (req, res) => {
  db.run('UPDATE employees SET active = 0 WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee disabled' });
  });
});

// Get all departments
router.get('/data/departments', (req, res) => {
  const departments = [
    'Projects',
    'Accounts',
    'HR / Talent Acquisition / EA',
    'Production',
    'Sales & Marketing',
    'Purchase',
    'Admin',
    'Housekeeping',
    'Design',
    'CAE'
  ];
  res.json(departments);
});

module.exports = router;
