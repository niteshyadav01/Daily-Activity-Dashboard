const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// GET /employees — paginated list with filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, department, search } = req.query;

    const filter = {};
    if (department && department !== 'all') filter.department = department;
    if (search) filter.employee_name = { $regex: search, $options: 'i' };

    const total = await Employee.countDocuments(filter);
    const skip = (Number(page) - 1) * Number(limit);

    const data = await Employee.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /employees/data/departments — must come BEFORE /:id
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
    'CAE',
  ];
  res.json(departments);
});

// GET /employees/:id
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /employees — create
router.post('/', async (req, res) => {
  try {
    const { employee_name, department } = req.body;
    if (!employee_name || !department) {
      return res.status(400).json({ error: 'Name and department required' });
    }

    const employee = new Employee({ employee_name, department });
    await employee.save();
    res.status(201).json(employee);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Employee already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /employees/:id — update
router.put('/:id', async (req, res) => {
  try {
    const { employee_name, department, active } = req.body;
    const updates = {};
    if (employee_name !== undefined) updates.employee_name = employee_name;
    if (department !== undefined) updates.department = department;
    if (active !== undefined) updates.active = Boolean(active);

    const employee = await Employee.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee updated', employee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /employees/:id
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /employees/:id/disable — soft delete
router.patch('/:id/disable', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee disabled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
