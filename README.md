# Employee Daily Activity Dashboard

A production-ready web application to manage daily treadmill/activity assignments for employees. Built with React, Node.js, Express, and SQLite.

## 📋 Features

### Dashboard
- Total active employees count
- Today's selected employees
- Current rotation progress and cycle number
- Employees pending in current cycle
- Monthly activity count
- Recent activity feed

### Employee Management
- **CRUD Operations**: Add, edit, delete, disable employees
- **Bulk Import**: Upload employee data using Excel (.xlsx, .csv)
- **Import Preview**: Detect duplicates, preview before importing
- **Search & Filter**: Search by name, filter by department
- **Pagination**: View employees in manageable chunks
- **Export**: Download employee list as Excel file

Employee Fields:
- ID, Name, Department, Status (Active/Inactive)
- Selection count, Cycle number, Last selected date

Supported Departments:
- Projects, Accounts, HR / Talent Acquisition / EA
- Production, Sales & Marketing, Purchase
- Admin, Housekeeping, Design, CAE

### Daily Activity Generator
- Generates exactly 4 employees per day (configurable)
- Smart selection algorithm:
  - Prioritizes employees with lowest selection count
  - Random shuffle among eligible employees
  - No duplicates on the same day
  - Automatic cycle reset when all reach same count
- Prevents duplicate generation for the same date
- Automatic updates to selected_count and last_selected_date

### Activity History
- View all generated activities
- Filter by month, department, employee name
- Pagination support
- Export activities to Excel

### Reports & Analytics
- Daily activity chart
- Department participation breakdown
- Top participating employees
- All-time participation metrics
- Monthly rotation statistics

### Settings
- Configure daily selection count
- System information display

## 🛠 Tech Stack

**Frontend:**
- React 19.2
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (navigation)
- Recharts (charts)
- Axios (HTTP client)

**Backend:**
- Node.js
- Express.js
- SQLite3 (database)
- XLSX (Excel parsing)
- ExcelJS (Excel generation)
- Multer (file uploads)

**Database:**
- SQLite (auto-creates tables)

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Clone & Setup

```bash
# Navigate to project directory
cd "Treadmill Dashboard"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

### Build for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:** Ready to run with `npm start`

## 📊 Database Schema

The application automatically creates SQLite tables:

```
employees
├── id (PK)
├── employee_name (UNIQUE)
├── department
├── active (1/0)
├── selected_count
├── cycle_number
├── last_selected_date
└── created_at

activities
├── activity_id (PK)
├── activity_date
├── employee_id (FK)
├── employee_name
├── department
├── cycle
└── created_at

activity_generation_log
├── log_id (PK)
├── generation_date (UNIQUE)
├── count_generated
└── created_at

settings
├── setting_id (PK)
├── setting_key (UNIQUE)
├── setting_value
├── created_at
└── updated_at
```

## 🔄 Rotation Logic

The daily activity generator uses this algorithm:

```
1. Find minimum selected_count among active employees
2. Get all employees with that count
3. Shuffle and pick top N (configurable, default 4)
4. Insert into activities table
5. Increment selected_count for each selected employee
6. Check if all active employees now have equal counts:
   - If yes: Increment cycle_number
   - If no: Continue to next day
7. Prevent duplicate generation for same date
```

## 📁 API Endpoints

### Employees
```
GET    /api/employees              - Get all with pagination
POST   /api/employees              - Create new
PUT    /api/employees/:id          - Update
DELETE /api/employees/:id          - Delete
PATCH  /api/employees/:id/disable  - Disable employee
GET    /api/employees/data/departments - Get all departments
```

### Activities
```
GET    /api/activities             - Get all with filters
GET    /api/activities/today       - Today's activities
POST   /api/activities/generate    - Generate today's activities
```

### Upload/Export
```
POST   /api/upload/preview         - Preview Excel file
POST   /api/upload/import          - Import employees
GET    /api/upload/export          - Export employees to Excel
GET    /api/upload/export-activities - Export activities to Excel
```

### Reports
```
GET    /api/reports/dashboard      - Dashboard statistics
GET    /api/reports/monthly/:yearMonth - Monthly report
GET    /api/reports/stats/all      - All-time statistics
```

### Settings
```
GET    /api/settings               - Get all settings
PUT    /api/settings/:key          - Update setting
```

## 📤 Excel Import Format

Your Excel file should have columns:
| Employee Name | Department |
|---|---|
| Salman Sir | Projects |
| Abhishekh Bharti | Projects |
| Dahesh | Accounts |

Supported file types: `.xlsx`, `.xls`, `.csv`

Features:
- Auto-detects column names (Name/Employee, Department/Dept)
- Ignores empty rows
- Detects duplicates in file
- Shows import summary before confirming

## 🌐 Deployment

### Local Deployment
1. Install dependencies: `npm install` (both frontend and backend)
2. Run backend: `npm run dev`
3. Run frontend: `npm run dev`
4. Open browser: http://localhost:5173

### Render Deployment

**Backend on Render:**
1. Create new Web Service on Render
2. Connect GitHub repo
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Copy database URL to environment

**Frontend on Render:**
1. Build first: `npm run build`
2. Create static site on Render
3. Point to `dist` folder

### Docker Deployment

```dockerfile
# Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Build: `docker build -t activity-dashboard .`
Run: `docker run -p 5000:5000 activity-dashboard`

## 🔐 Security Considerations

- All inputs are validated before database insertion
- File uploads are restricted to .xlsx, .xls, .csv
- Database uses SQLite with proper parameterized queries
- CORS enabled for frontend communication
- Error messages don't expose sensitive information

## 📝 File Structure

```
Treadmill Dashboard/
├── backend/
│   ├── server.js
│   ├── DB.js
│   ├── package.json
│   ├── routes/
│   │   ├── employees.js
│   │   ├── activities.js
│   │   ├── upload.js
│   │   ├── settings.js
│   │   └── reports.js
│   └── dashboard.db (created automatically)
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── TopBar.jsx
    │   │   ├── StatCard.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   └── Table.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Employees.jsx
    │   │   ├── Upload.jsx
    │   │   ├── GenerateActivity.jsx
    │   │   ├── History.jsx
    │   │   ├── Reports.jsx
    │   │   └── Settings.jsx
    │   ├── utils/
    │   │   ├── api.js
    │   │   └── helpers.js
    │   └── hooks/
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── vite.config.js
```

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, mobile
- **Sidebar Navigation**: Easy access to all features
- **Top Navigation Bar**: Current date, search, profile
- **Charts**: Monthly participation, department breakdown
- **Tables**: Sortable, filterable, paginated
- **Forms**: Inline editing, validation
- **Alerts**: Success/error notifications
- **Loading States**: Spinners for async operations

## 🧪 Testing

### Manual Testing Checklist

1. **Add Employee** - Manual entry works
2. **Bulk Import** - Excel import with duplicates detection
3. **Daily Generation** - Produces correct count, no duplicates
4. **Rotation Logic** - Cycle increments correctly
5. **Search & Filter** - Results accurate
6. **Export** - Excel files download correctly
7. **Dashboard** - Stats update in real-time

## 🐛 Troubleshooting

**Backend won't start:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run dev
```

**Database locked error:**
- Ensure only one backend instance is running
- Delete `dashboard.db` if corrupted (will recreate on startup)

**Frontend can't connect:**
- Verify backend is running on port 5000
- Check CORS settings in server.js

**Excel import fails:**
- Verify file has valid headers
- Check file isn't corrupted
- Ensure no special characters in employee names

## 📞 Support

For issues or feature requests, contact the development team.

## 📄 License

Internal use only - Profile Data Center Solutions Pvt. Ltd.

## 🎉 Changelog

### v1.0.0 - Initial Release
- Complete employee management system
- Daily activity generation with smart rotation
- Excel import/export functionality
- Activity history and reporting
- Dashboard with analytics
- Settings configuration

---

**Build Date**: June 2024  
**Status**: Production Ready ✅
