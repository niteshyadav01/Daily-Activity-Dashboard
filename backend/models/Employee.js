const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    employee_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    selected_count: {
      type: Number,
      default: 0,
    },
    cycle_number: {
      type: Number,
      default: 1,
    },
    last_selected_date: {
      type: String, // stored as YYYY-MM-DD string to match existing logic
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Employee', employeeSchema);
