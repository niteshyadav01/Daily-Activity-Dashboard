const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    activity_date: {
      type: String, // stored as YYYY-MM-DD string
      required: true,
    },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    employee_name: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    cycle: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Index for fast date lookups
activitySchema.index({ activity_date: 1 });
activitySchema.index({ activity_date: 1, department: 1 });

module.exports = mongoose.model('Activity', activitySchema);
