const mongoose = require('mongoose');

const activityGenerationLogSchema = new mongoose.Schema(
  {
    generation_date: {
      type: String, // stored as YYYY-MM-DD string
      required: true,
      unique: true,
    },
    count_generated: {
      type: Number,
      default: 4,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('ActivityGenerationLog', activityGenerationLogSchema);
