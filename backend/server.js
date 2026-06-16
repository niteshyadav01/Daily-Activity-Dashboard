require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Database
require('./DB');

// Routes
const employeeRoutes = require('./routes/employees');
const activityRoutes = require('./routes/activities');
const uploadRoutes = require('./routes/upload');
const settingsRoutes = require('./routes/settings');
const reportsRoutes = require('./routes/reports');

const app = express();

const PORT = process.env.PORT || 5000;

// ======================
// Middleware
// ======================

app.use(cors());

app.use(
  bodyParser.json({
    limit: '50mb'
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '50mb'
  })
);

app.use(express.json());

// Upload Folder
app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads')
  )
);

// ======================
// ROOT BACKEND PAGE
// ======================

app.get('/', (req, res) => {
  res.json({
    success: true,
    app: 'Employee Activity Dashboard Backend',
    status: 'Running',

    endpoints: {
      health: '/api/health',
      employees: '/api/employees',
      activities: '/api/activities',
      reports: '/api/reports/dashboard',
      upload: '/api/upload',
      settings: '/api/settings'
    }
  });
});

// ======================
// API
// ======================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend Running'
  });
});

app.use('/api/employees', employeeRoutes);

app.use('/api/activities', activityRoutes);

app.use('/api/upload', uploadRoutes);

app.use('/api/settings', settingsRoutes);

app.use('/api/reports', reportsRoutes);

// ======================
// ERROR HANDLER
// ======================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    error: err.message
  });
});

// ======================
// 404
// ======================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ======================
// START SERVER
// ======================

app.listen(PORT, () => {
  console.log('\n🚀 BACKEND RUNNING');

  console.log(
    `Backend → http://localhost:${PORT}`
  );

  console.log(
    `Health → http://localhost:${PORT}/api/health`
  );

  console.log(
    `Employees → http://localhost:${PORT}/api/employees`
  );

  console.log(
    `Reports → http://localhost:${PORT}/api/reports/dashboard`
  );

  console.log('\n✅ Ready\n');
});