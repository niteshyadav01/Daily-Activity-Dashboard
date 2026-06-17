const mongoose = require('mongoose');
const Setting = require('./models/Setting');

const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas');
    await seedDefaultSettings();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

async function seedDefaultSettings() {
  try {
    await Setting.findOneAndUpdate(
      { setting_key: 'daily_selection_count' },
      { $setOnInsert: { setting_key: 'daily_selection_count', setting_value: '4' } },
      { upsert: true, returnDocument: 'after' }
    );
    console.log('Default settings seeded');
  } catch (err) {
    console.error('Error seeding settings:', err.message);
  }
}

module.exports = connectDB;
