const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const db = require('../DB');
const router = express.Router();

// Setup multer for file uploads
const upload = multer({ dest: path.join(__dirname, '../uploads') });

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload and preview Excel/CSV file
router.post('/preview', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    let data = [];

    if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(sheet);
    } else if (ext === '.csv') {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(sheet);
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Only .xlsx and .csv files are supported' });
    }

    // Parse the data
    const parsed = data
      .filter(row => {
        // Filter out empty rows
        return Object.values(row).some(val => val !== '' && val !== null && val !== undefined);
      })
      .map(row => {
        // Normalize column names
        const nameCol = Object.keys(row).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('employee'));
        const deptCol = Object.keys(row).find(k => k.toLowerCase().includes('department') || k.toLowerCase().includes('dept'));

        return {
          employee_name: row[nameCol]?.toString().trim() || '',
          department: row[deptCol]?.toString().trim() || ''
        };
      })
      .filter(row => row.employee_name && row.department);

    // Check for duplicates in file
    const uniqueMap = new Map();
    const duplicates = [];
    const valid = [];

    parsed.forEach(row => {
      if (uniqueMap.has(row.employee_name.toLowerCase())) {
        duplicates.push(row);
      } else {
        uniqueMap.set(row.employee_name.toLowerCase(), true);
        valid.push(row);
      }
    });

    // Get existing employees
    db.all('SELECT employee_name FROM employees', [], (err, existing) => {
      if (err) {
        fs.unlinkSync(filePath);
        return res.status(500).json({ error: err.message });
      }

      const existingNames = new Set(
        (existing || []).map(e => e.employee_name.toLowerCase())
      );

      const skipped = valid.filter(row =>
        existingNames.has(row.employee_name.toLowerCase())
      );

      const toAdd = valid.filter(row =>
        !existingNames.has(row.employee_name.toLowerCase())
      );

      // Clean up file
      fs.unlinkSync(filePath);

      res.json({
        summary: {
          total: parsed.length,
          valid: valid.length,
          toAdd: toAdd.length,
          skipped: skipped.length,
          duplicates: duplicates.length
        },
        data: {
          toAdd,
          skipped,
          duplicates
        }
      });
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: error.message });
  }
});

// Import employees
router.post('/import', (req, res) => {
  const { employees } = req.body;

  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ error: 'No employees to import' });
  }

  let inserted = 0;
  let failed = 0;
  const results = [];

  employees.forEach(emp => {
    db.run(
      'INSERT INTO employees (employee_name, department) VALUES (?, ?)',
      [emp.employee_name, emp.department],
      function(err) {
        if (err) {
          failed++;
          results.push({
            employee_name: emp.employee_name,
            status: 'failed',
            reason: err.message
          });
        } else {
          inserted++;
          results.push({
            employee_name: emp.employee_name,
            status: 'inserted',
            id: this.lastID
          });
        }

        if (inserted + failed === employees.length) {
          res.json({
            message: 'Import completed',
            inserted,
            failed,
            results
          });
        }
      }
    );
  });
});

// Export employees to Excel
router.get('/export', (req, res) => {
  db.all('SELECT id, employee_name, department, active, selected_count, cycle_number, last_selected_date FROM employees ORDER BY department, employee_name', [], async (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Employees');

      // Add headers
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Employee Name', key: 'employee_name', width: 25 },
        { header: 'Department', key: 'department', width: 25 },
        { header: 'Active', key: 'active', width: 10 },
        { header: 'Selected Count', key: 'selected_count', width: 15 },
        { header: 'Cycle Number', key: 'cycle_number', width: 15 },
        { header: 'Last Selected Date', key: 'last_selected_date', width: 20 }
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      // Add data rows
      rows.forEach(row => {
        worksheet.addRow({
          ...row,
          active: row.active ? 'Yes' : 'No'
        });
      });

      // Generate file
      const fileName = `employees_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = path.join(uploadsDir, fileName);

      await workbook.xlsx.writeFile(filePath);

      res.download(filePath, fileName, (err) => {
        if (err) console.error('Download error:', err);
        fs.unlinkSync(filePath); // Clean up after download
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

// Export activities to Excel
router.get('/export-activities', (req, res) => {
  db.all(
    'SELECT activity_id, activity_date, employee_name, department, cycle FROM activities ORDER BY activity_date DESC',
    [],
    async (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Activities');

        // Add headers
        worksheet.columns = [
          { header: 'Activity ID', key: 'activity_id', width: 12 },
          { header: 'Date', key: 'activity_date', width: 15 },
          { header: 'Employee Name', key: 'employee_name', width: 25 },
          { header: 'Department', key: 'department', width: 25 },
          { header: 'Cycle', key: 'cycle', width: 10 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF70AD47' }
        };

        // Add data rows
        rows.forEach(row => {
          worksheet.addRow(row);
        });

        // Generate file
        const fileName = `activities_${new Date().toISOString().split('T')[0]}.xlsx`;
        const filePath = path.join(uploadsDir, fileName);

        await workbook.xlsx.writeFile(filePath);

        res.download(filePath, fileName, (err) => {
          if (err) console.error('Download error:', err);
          fs.unlinkSync(filePath);
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );
});

module.exports = router;
