const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const Employee = require('../models/Employee');
const ActivityGenerationLog = require('../models/ActivityGenerationLog');
const Setting = require('../models/Setting');

// Helper — get today's date as YYYY-MM-DD in local timezone
const getLocalDate = () => {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
};

// GET /activities/today
router.get('/today', async (req, res) => {
  try {
    const today = getLocalDate();
    const activities = await Activity.find({ activity_date: today }).sort({ employee_name: 1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /activities — with filters + pagination
router.get('/', async (req, res) => {
  try {
    const { month, department, search, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (month) {
      // match YYYY-MM prefix
      filter.activity_date = { $regex: `^${month}` };
    }

    if (department && department !== 'all') {
      filter.department = department;
    }

    if (search) {
      filter.employee_name = { $regex: search, $options: 'i' };
    }

    const total = await Activity.countDocuments(filter);
    const skip = (Number(page) - 1) * Number(limit);

    const data = await Activity.find(filter)
      .sort({ activity_date: -1, _id: -1 })
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

// POST /activities/generate
router.post('/generate', async (req, res) => {
  try {
    const today = getLocalDate();

    // Delete existing activities for today (allows re-generation)
    await Activity.deleteMany({ activity_date: today });

    // Get daily selection count from settings
    const setting = await Setting.findOne({ setting_key: 'daily_selection_count' });
    const dailyCount = setting ? parseInt(setting.setting_value) : 4;

    // Get minimum selected_count among active employees
    const minResult = await Employee.aggregate([
      { $match: { active: true } },
      { $group: { _id: null, min_count: { $min: '$selected_count' } } },
    ]);

    if (!minResult.length) {
      return res.status(400).json({ error: 'No active employees available' });
    }

    const minCount = minResult[0].min_count;

    // Get active employees with minimum selected_count
    let selectedEmployees = await Employee.aggregate([
      { $match: { active: true, selected_count: minCount } },
      { $sample: { size: dailyCount } },
    ]);

    // If not enough, pull from next tier
    if (selectedEmployees.length < dailyCount) {
      const existingIds = selectedEmployees.map((e) => e._id);
      const additional = await Employee.aggregate([
        {
          $match: {
            active: true,
            selected_count: minCount + 1,
            _id: { $nin: existingIds },
          },
        },
        { $sample: { size: dailyCount - selectedEmployees.length } },
      ]);
      selectedEmployees = [...selectedEmployees, ...additional];
    }

    if (!selectedEmployees.length) {
      return res.status(400).json({ error: 'No active employees available' });
    }

    // Insert activities
    const slice = selectedEmployees.slice(0, dailyCount);
    const activityDocs = slice.map((emp) => ({
      activity_date: today,
      employee_id: emp._id,
      employee_name: emp.employee_name,
      department: emp.department,
      cycle: emp.cycle_number,
    }));

    const inserted = await Activity.insertMany(activityDocs);

    // Update selected_count and last_selected_date for each employee
    const bulkOps = slice.map((emp) => ({
      updateOne: {
        filter: { _id: emp._id },
        update: {
          $inc: { selected_count: 1 },
          $set: { last_selected_date: today },
        },
      },
    }));
    await Employee.bulkWrite(bulkOps);

    // Check if all active employees now have the same selected_count → increment cycle
    const cycleCheck = await Employee.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: null,
          min_count: { $min: '$selected_count' },
          max_count: { $max: '$selected_count' },
        },
      },
    ]);

    if (cycleCheck.length && cycleCheck[0].min_count === cycleCheck[0].max_count) {
      await Employee.updateMany({ active: true }, { $inc: { cycle_number: 1 } });
    }

    // Log the generation (upsert so re-runs don't duplicate the log)
    await ActivityGenerationLog.findOneAndUpdate(
      { generation_date: today },
      { count_generated: inserted.length },
      { upsert: true }
    );

    res.status(201).json({
      message: 'Activity generated successfully',
      date: today,
      activities: inserted.map((a) => ({
        activity_id: a._id,
        employee_id: a.employee_id,
        employee_name: a.employee_name,
        department: a.department,
        cycle: a.cycle,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /activities/reset — clear today's activities
router.post('/reset', async (req, res) => {
  try {
    const today = getLocalDate();
    const result = await Activity.deleteMany({ activity_date: today });
    res.json({
      message: "Today's activities cleared successfully",
      date: today,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /activities/clear-all — delete every activity
router.post('/clear-all', async (req, res) => {
  try {
    const result = await Activity.deleteMany({});
    res.json({
      message: 'All activities cleared successfully',
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
