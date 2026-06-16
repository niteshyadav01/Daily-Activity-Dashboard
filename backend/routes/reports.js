const express = require('express');
const db = require('../DB');
const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  Promise.all([
    getEmployeeCount(),
    getTodaySelectionCount(today),
    getRotationProgress(),
    getPendingEmployees(),
    getMonthlyActivityCount(),
    getRecentActivities()
  ]).then(([totalEmployees, todaySelected, rotationProgress, pending, monthlyCount, recentActivities]) => {
    res.json({
      totalEmployees,
      todaySelected,
      rotationProgress,
      pendingEmployees: pending,
      monthlyActivityCount: monthlyCount,
      recentActivities
    });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

function getEmployeeCount() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM employees WHERE active = 1', [], (err, row) => {
      if (err) reject(err);
      resolve(row?.count || 0);
    });
  });
}

function getTodaySelectionCount(today) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM activities WHERE activity_date = ?',
      [today],
      (err, row) => {
        if (err) reject(err);
        resolve(row?.count || 0);
      }
    );
  });
}

function getRotationProgress() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT cycle_number, COUNT(*) as count 
       FROM employees 
       WHERE active = 1 
       GROUP BY cycle_number 
       ORDER BY cycle_number DESC 
       LIMIT 1`,
      [],
      (err, row) => {
        if (err) reject(err);
        const maxCycle = row?.[0]?.cycle_number || 1;
        db.get(
          `SELECT MAX(selected_count) as max_count FROM employees WHERE active = 1`,
          [],
          (err, maxRow) => {
            if (err) reject(err);
            const progress = {
              currentCycle: maxCycle,
              maxSelected: maxRow?.max_count || 0
            };
            resolve(progress);
          }
        );
      }
    );
  });
}

function getPendingEmployees() {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as count 
       FROM employees 
       WHERE active = 1 AND selected_count < (
         SELECT MAX(selected_count) FROM employees WHERE active = 1
       )`,
      [],
      (err, row) => {
        if (err) reject(err);
        resolve(row?.count || 0);
      }
    );
  });
}

function getMonthlyActivityCount() {
  return new Promise((resolve, reject) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    db.get(
      'SELECT COUNT(*) as count FROM activities WHERE activity_date LIKE ?',
      [`${currentMonth}%`],
      (err, row) => {
        if (err) reject(err);
        resolve(row?.count || 0);
      }
    );
  });
}

function getRecentActivities() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT activity_id, activity_date, employee_name, department, cycle 
       FROM activities 
       ORDER BY activity_date DESC, activity_id DESC 
       LIMIT 10`,
      [],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      }
    );
  });
}

// Get monthly report
router.get('/monthly/:yearMonth', (req, res) => {
  const { yearMonth } = req.params;

  Promise.all([
    getMonthlyStats(yearMonth),
    getDepartmentStats(yearMonth),
    getTopParticipants(yearMonth)
  ]).then(([monthlyStats, deptStats, topParticipants]) => {
    res.json({
      month: yearMonth,
      stats: monthlyStats,
      departmentStats: deptStats,
      topParticipants
    });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

function getMonthlyStats(yearMonth) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT activity_date, COUNT(*) as count 
       FROM activities 
       WHERE activity_date LIKE ? 
       GROUP BY activity_date 
       ORDER BY activity_date`,
      [`${yearMonth}%`],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      }
    );
  });
}

function getDepartmentStats(yearMonth) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT department, COUNT(*) as count 
       FROM activities 
       WHERE activity_date LIKE ? 
       GROUP BY department 
       ORDER BY count DESC`,
      [`${yearMonth}%`],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      }
    );
  });
}

function getTopParticipants(yearMonth) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT employee_name, employee_id, COUNT(*) as count 
       FROM activities 
       WHERE activity_date LIKE ? 
       GROUP BY employee_id 
       ORDER BY count DESC 
       LIMIT 10`,
      [`${yearMonth}%`],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      }
    );
  });
}

// Get all time stats
router.get('/stats/all', (req, res) => {
  Promise.all([
    getTotalEmployeesStats(),
    getAllTimeParticipation(),
    getDepartmentParticipation()
  ]).then(([totalStats, participation, deptParticipation]) => {
    res.json({
      totalStats,
      allTimeParticipation: participation,
      departmentParticipation: deptParticipation
    });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

function getTotalEmployeesStats() {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active,
              SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) as inactive
       FROM employees`,
      [],
      (err, row) => {
        if (err) reject(err);
        resolve(row || {});
      }
    );
  });
}

function getAllTimeParticipation() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT employee_name, COUNT(*) as count 
       FROM activities 
       GROUP BY employee_id 
       ORDER BY count DESC`,
      [],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      }
    );
  });
}

function getDepartmentParticipation() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT department, COUNT(*) as count 
       FROM activities 
       GROUP BY department 
       ORDER BY count DESC`,
      [],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      }
    );
  });
}

module.exports = router;
