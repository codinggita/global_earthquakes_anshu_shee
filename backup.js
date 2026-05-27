const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Earthquake = require('./src/models/Earthquake');

// Load environment variables
dotenv.config();

const backupData = async () => {
  try {
    console.log('[Backup] Initiating database backup process...');

    // 1. Establish database connection
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/earthquakes';
    await mongoose.connect(connStr);
    console.log('[Backup] MongoDB Connected for backup.');

    // 2. Fetch all non-deleted records
    console.log('[Backup] Querying all active earthquake records from database...');
    const records = await Earthquake.find({ isDeleted: { $ne: true } }).select('-__v -createdAt -updatedAt');
    console.log(`[Backup] Retrieved ${records.length} records from database.`);

    if (records.length === 0) {
      console.warn('[Backup] WARNING: No active earthquake records found in database to backup.');
    }

    // 3. Format to clean JSON and write to file
    const backupFileName = `backup_earthquakes_${Date.now()}.json`;
    const backupPath = path.join(__dirname, backupFileName);

    console.log(`[Backup] Writing backup data to: ${backupFileName}...`);
    fs.writeFileSync(backupPath, JSON.stringify(records, null, 2), 'utf8');

    console.log('\x1b[32m%s\x1b[0m', `[Backup] SUCCESS: Database backup complete! ${records.length} records written to ${backupFileName}`);
    
    // Close connection cleanly
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `[Backup] CRITICAL ERROR occurred during database backup: ${error.message}`);
    process.exit(1);
  }
};

// Start execution
backupData();
