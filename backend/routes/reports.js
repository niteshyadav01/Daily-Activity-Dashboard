const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const Employee = require('../models/Employee');

// Helper — get today's date as YYYY-MM-DD in local timezone
const getLocalDate = () => new Date().toLocaleDateString('en-CA');

// GET /reports/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const today = getLocalDate();
    const currentMonth = today.slice(0, 7); // YYYY-MM

    const [
      totalEmployees,
      todaySelected,
      rotationProgress,
      pendingEmployees,
      monthlyActivityCount,
      recentActivities,
    ] = await Promise.all([
      // Total active employees
      Employee.countDocuments({ active: true }),

      // Today's selected count
      Activity.countDocuments({ activity_date: today }),

      // Rotation progress
      Employee.aggregate([
        { $match: { active: true } },
        {
          $group: {
            _id: null,
            maxCycle: { $max: '$cycle_number' },
            maxSelected: { $max: '$selected_count' },
          },
        },
      ]),

      // Pending employees (selected_count < max)
      Employee.aggregate([
        { $match: { active: true } },
        {
          $group: {
            _id: null,
            maxSelected: { $max: '$selected_count' },
          },
        },
      ]).then(async (result) => {
        if (!result.length) return 0;
        return Employee.countDocuments({
          active: true,
          selected_count: { $lt: result[0].maxSelected },
        });
      }),

      // Monthly activity count
      Activity.countDocuments({ activity_date: { $regex: `^${currentMonth}` } }),

      // Recent activities (last 10)
      Activity.find()
        .sort({ activity_date: -1, _id: -1 })
        .limit(10)
        .select('activity_date employee_name department cycle'),
    ]);

    const rotation = rotationProgress[0] || {};

    res.json({
      totalEmployees,
      todaySelected,
      rotationProgress: {
        currentCycle: rotation.maxCycle || 1,
        maxSelected: rotation.maxSelected || 0,
      },
      pendingEmployees,
      monthlyActivityCount,
      recentActivities,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reports/monthly/:yearMonth
router.get('/monthly/:yearMonth', async (req, res) => {
  try {
    const { yearMonth } = req.params;
    const dateFilter = { activity_date: { $regex: `^${yearMonth}` } };

    const [monthlyStats, deptStats, topParticipants] = await Promise.all([
      // Daily counts
      Activity.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$activity_date', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, activity_date: '$_id', count: 1 } },
      ]),

      // Department breakdown
      Activity.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, department: '$_id', count: 1 } },
      ]),

      // Top participants
      Activity.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$employee_id', employee_name: { $first: '$employee_name' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, employee_id: '$_id', employee_name: 1, count: 1 } },
      ]),
    ]);

    res.json({
      month: yearMonth,
      stats: monthlyStats,
      departmentStats: deptStats,
      topParticipants,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reports/stats/all
router.get('/stats/all', async (req, res) => {
  try {
    const [totalStats, allTimeParticipation, departmentParticipation] = await Promise.all([
      // Employee totals
      Employee.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$active', 1, 0] } },
            inactive: { $sum: { $cond: ['$active', 0, 1] } },
          },
        },
        { $project: { _id: 0, total: 1, active: 1, inactive: 1 } },
      ]).then((r) => r[0] || { total: 0, active: 0, inactive: 0 }),

      // All-time participation per employee (top 10)
      Activity.aggregate([
        { $group: { _id: '$employee_id', employee_name: { $first: '$employee_name' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, employee_id: '$_id', employee_name: 1, count: 1 } },
      ]),

      // Department participation
      Activity.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, department: '$_id', count: 1 } },
      ]),
    ]);

    res.json({
      totalStats,
      allTimeParticipation,
      departmentParticipation,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
