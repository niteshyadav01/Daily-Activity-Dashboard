require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./DB');

// Routes
const employeeRoutes = require('./routes/employees');
const activityRoutes = require('./routes/activities');
const uploadRoutes = require('./routes/upload');
const settingsRoutes = require('./routes/settings');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// Connect to MongoDB
// ======================
connectDB();

// ======================
// Middleware
// ======================
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======================
// ROOT
// ======================
app.get('/', (req, res) => {
  res.json({
    success: true,
    app: 'Employee Activity Dashboard Backend',
    status: 'Running',
    database: 'MongoDB Atlas',
    endpoints: {
      health: '/api/health',
      employees: '/api/employees',
      activities: '/api/activities',
      reports: '/api/reports/dashboard',
      upload: '/api/upload',
      settings: '/api/settings',
    },
  });
});

// ======================
// API
// ======================
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend Running', database: 'MongoDB Atlas' });
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
  res.status(500).json({ success: false, error: err.message });
});

// ======================
// 404
// ======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ======================
// START
// ======================
app.listen(PORT, () => {
  console.log('\n🚀 BACKEND RUNNING');
  console.log(`Backend  → http://localhost:${PORT}`);
  console.log(`Health   → http://localhost:${PORT}/api/health`);
  console.log(`Employees→ http://localhost:${PORT}/api/employees`);
  console.log(`Reports  → http://localhost:${PORT}/api/reports/dashboard`);
  console.log('\n✅ Ready\n');
});
