const express = require('express');
const db = require('../DB');
const router = express.Router();

// Get today's activities
router.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  db.all(
    `SELECT * FROM activities WHERE activity_date = ? ORDER BY employee_name`,
    [today],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// Get activities with filters
router.get('/', (req, res) => {
  const month = req.query.month;
  const department = req.query.department;
  const search = req.query.search;
  const page = req.query.page || 1;
  const limit = req.query.limit || 20;

  let query = 'SELECT * FROM activities WHERE 1=1';
  const params = [];

  if (month) {
    query += ' AND activity_date LIKE ?';
    params.push(`${month}%`);
  }

  if (department && department !== 'all') {
    query += ' AND department = ?';
    params.push(department);
  }

  if (search) {
    query += ' AND employee_name LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY activity_date DESC';

  // Get total count
  db.get(query.replace('SELECT *', 'SELECT COUNT(*) as count'), params, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });

    const offset = (page - 1) * limit;
    const paginatedQuery = query + ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.all(paginatedQuery, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
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

// Generate today's activity (can be generated multiple times)
router.post('/generate', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // Delete existing activities for today if they exist (allows re-generation)
  db.run(
    'DELETE FROM activities WHERE activity_date = ?',
    [today],
    (err) => {
      if (err) {
        console.error('Error deleting old activities:', err);
      }

      // Get daily selection count from settings
      db.get(
        'SELECT setting_value FROM settings WHERE setting_key = ?',
        ['daily_selection_count'],
        (err, settingRow) => {
          if (err) return res.status(500).json({ error: err.message });

          const dailyCount = settingRow ? parseInt(settingRow.setting_value) : 4;

          // Get minimum selected_count among active employees
          db.get(
            'SELECT MIN(selected_count) as min_count FROM employees WHERE active = 1',
            [],
            (err, minResult) => {
              if (err) return res.status(500).json({ error: err.message });

              const minCount = minResult.min_count !== null ? minResult.min_count : 0;

              // Get all active employees with minimum selected_count
              db.all(
                'SELECT * FROM employees WHERE active = 1 AND selected_count = ? ORDER BY RANDOM() LIMIT ?',
                [minCount, dailyCount],
                (err, selectedEmployees) => {
                  if (err) return res.status(500).json({ error: err.message });

                  if (!selectedEmployees || selectedEmployees.length === 0) {
                    return res.status(400).json({ error: 'No active employees available' });
                  }

                  // If less than required, get more from next tier
                  if (selectedEmployees.length < dailyCount) {
                    const placeholders = selectedEmployees.map(e => e.id).join(',');
                    db.all(
                      `SELECT * FROM employees 
                       WHERE active = 1 
                       AND id NOT IN (${placeholders}) 
                       AND selected_count = ? 
                       ORDER BY RANDOM() 
                       LIMIT ?`,
                      [minCount + 1, dailyCount - selectedEmployees.length],
                      (err, additionalEmployees) => {
                        if (err) return res.status(500).json({ error: err.message });
                        selectedEmployees.push(...additionalEmployees);
                        saveActivities(selectedEmployees, today, dailyCount, res);
                      }
                    );
                  } else {
                    saveActivities(selectedEmployees, today, dailyCount, res);
                  }
                }
              );
            }
          );
        }
      );
    }
  );
});

function saveActivities(employees, today, dailyCount, res) {
  const activitiesData = [];
  let completed = 0;

  employees.slice(0, dailyCount).forEach((employee) => {
    db.run(
      `INSERT INTO activities (activity_date, employee_id, employee_name, department, cycle)
       VALUES (?, ?, ?, ?, ?)`,
      [today, employee.id, employee.employee_name, employee.department, employee.cycle_number],
      function(err) {
        if (err) {
          console.error('Error inserting activity:', err);
        } else {
          activitiesData.push({
            activity_id: this.lastID,
            employee_id: employee.id,
            employee_name: employee.employee_name,
            department: employee.department,
            cycle: employee.cycle_number
          });
        }
        completed++;

        if (completed === dailyCount) {
          updateEmployeesAndLog(employees, today, dailyCount, activitiesData, res);
        }
      }
    );
  });
}

function updateEmployeesAndLog(employees, today, dailyCount, activitiesData, res) {
  let updated = 0;

  // Update selected_count and last_selected_date for each employee
  employees.slice(0, dailyCount).forEach((employee) => {
    db.run(
      `UPDATE employees 
       SET selected_count = selected_count + 1, 
           last_selected_date = ?
       WHERE id = ?`,
      [today, employee.id],
      function(err) {
        if (err) console.error('Error updating employee:', err);
        updated++;

        if (updated === dailyCount) {
          // Check if all active employees have same selected_count, if so increment cycle
          checkAndUpdateCycle(today, activitiesData, res);
        }
      }
    );
  });
}

function checkAndUpdateCycle(today, activitiesData, res) {
  db.get(
    `SELECT MIN(selected_count) as min_count, MAX(selected_count) as max_count
     FROM employees WHERE active = 1`,
    [],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (result.min_count === result.max_count) {
        // All have same count, increment cycle
        db.run(
          'UPDATE employees SET cycle_number = cycle_number + 1 WHERE active = 1',
          function(err) {
            if (err) console.error('Error updating cycle:', err);
            recordGenerationLog(today, activitiesData, res);
          }
        );
      } else {
        recordGenerationLog(today, activitiesData, res);
      }
    }
  );
}

function recordGenerationLog(today, activitiesData, res) {
  db.run(
    'INSERT INTO activity_generation_log (generation_date, count_generated) VALUES (?, ?)',
    [today, activitiesData.length],
    function(err) {
      if (err) console.error('Error logging generation:', err);
      res.status(201).json({
        message: 'Activity generated successfully',
        date: today,
        activities: activitiesData
      });
    }
  );
}

// Reset activities - clear all today's activities
router.post('/reset', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  db.run(
    'DELETE FROM activities WHERE activity_date = ?',
    [today],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        message: 'Today\'s activities cleared successfully',
        date: today,
        deletedCount: this.changes
      });
    }
  );
});

// Clear all activities (complete reset)
router.post('/clear-all', (req, res) => {
  db.run(
    'DELETE FROM activities',
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        message: 'All activities cleared successfully',
        deletedCount: this.changes
      });
    }
  );
});

module.exports = router;
