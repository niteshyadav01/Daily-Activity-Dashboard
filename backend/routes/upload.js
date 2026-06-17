const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Employee = require('../models/Employee');
const Activity = require('../models/Activity');

// Setup multer for file uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const upload = multer({ dest: uploadsDir });

// POST /upload/preview — parse Excel/CSV and preview what would be imported
router.post('/preview', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (ext !== '.xlsx' && ext !== '.xls' && ext !== '.csv') {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Only .xlsx and .csv files are supported' });
    }

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const parsed = data
      .filter((row) => Object.values(row).some((v) => v !== '' && v != null))
      .map((row) => {
        const nameCol = Object.keys(row).find(
          (k) => k.toLowerCase().includes('name') || k.toLowerCase().includes('employee')
        );
        const deptCol = Object.keys(row).find(
          (k) => k.toLowerCase().includes('department') || k.toLowerCase().includes('dept')
        );
        return {
          employee_name: row[nameCol]?.toString().trim() || '',
          department: row[deptCol]?.toString().trim() || '',
        };
      })
      .filter((row) => row.employee_name && row.department);

    // Deduplicate within file
    const uniqueMap = new Map();
    const duplicates = [];
    const valid = [];
    parsed.forEach((row) => {
      if (uniqueMap.has(row.employee_name.toLowerCase())) {
        duplicates.push(row);
      } else {
        uniqueMap.set(row.employee_name.toLowerCase(), true);
        valid.push(row);
      }
    });

    // Check against existing employees in DB
    const existing = await Employee.find({}, 'employee_name');
    const existingNames = new Set(existing.map((e) => e.employee_name.toLowerCase()));

    const skipped = valid.filter((row) => existingNames.has(row.employee_name.toLowerCase()));
    const toAdd = valid.filter((row) => !existingNames.has(row.employee_name.toLowerCase()));

    fs.unlinkSync(filePath);

    res.json({
      summary: {
        total: parsed.length,
        valid: valid.length,
        toAdd: toAdd.length,
        skipped: skipped.length,
        duplicates: duplicates.length,
      },
      data: { toAdd, skipped, duplicates },
    });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

// POST /upload/import — bulk insert employees
router.post('/import', async (req, res) => {
  try {
    const { employees } = req.body;
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ error: 'No employees to import' });
    }

    const results = [];
    for (const emp of employees) {
      try {
        const doc = await Employee.create({
          employee_name: emp.employee_name,
          department: emp.department,
        });
        results.push({ employee_name: emp.employee_name, status: 'inserted', id: doc._id });
      } catch (err) {
        results.push({ employee_name: emp.employee_name, status: 'failed', reason: err.message });
      }
    }

    const inserted = results.filter((r) => r.status === 'inserted').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    res.json({ message: 'Import completed', inserted, failed, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /upload/export — download employees as Excel
router.get('/export', async (req, res) => {
  try {
    const rows = await Employee.find()
      .sort({ department: 1, employee_name: 1 })
      .select('_id employee_name department active selected_count cycle_number last_selected_date');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employees');

    worksheet.columns = [
      { header: 'ID',                 key: 'id',                 width: 26 },
      { header: 'Employee Name',      key: 'employee_name',      width: 25 },
      { header: 'Department',         key: 'department',         width: 25 },
      { header: 'Active',             key: 'active',             width: 10 },
      { header: 'Selected Count',     key: 'selected_count',     width: 15 },
      { header: 'Cycle Number',       key: 'cycle_number',       width: 15 },
      { header: 'Last Selected Date', key: 'last_selected_date', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    rows.forEach((row) => {
      worksheet.addRow({
        id: row._id.toString(),
        employee_name: row.employee_name,
        department: row.department,
        active: row.active ? 'Yes' : 'No',
        selected_count: row.selected_count,
        cycle_number: row.cycle_number,
        last_selected_date: row.last_selected_date || '',
      });
    });

    const fileName = `employees_${new Date().toLocaleDateString('en-CA')}.xlsx`;
    const filePath = path.join(uploadsDir, fileName);
    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, fileName, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /upload/export-activities — download activities as Excel
router.get('/export-activities', async (req, res) => {
  try {
    const rows = await Activity.find()
      .sort({ activity_date: -1 })
      .select('_id activity_date employee_name department cycle');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Activities');

    worksheet.columns = [
      { header: 'Activity ID',  key: 'activity_id',  width: 26 },
      { header: 'Date',         key: 'activity_date', width: 15 },
      { header: 'Employee Name',key: 'employee_name', width: 25 },
      { header: 'Department',   key: 'department',    width: 25 },
      { header: 'Cycle',        key: 'cycle',         width: 10 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };

    rows.forEach((row) => {
      worksheet.addRow({
        activity_id: row._id.toString(),
        activity_date: row.activity_date,
        employee_name: row.employee_name,
        department: row.department,
        cycle: row.cycle,
      });
    });

    const fileName = `activities_${new Date().toLocaleDateString('en-CA')}.xlsx`;
    const filePath = path.join(uploadsDir, fileName);
    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, fileName, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
