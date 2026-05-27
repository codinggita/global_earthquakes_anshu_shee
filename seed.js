const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Earthquake = require('./src/models/Earthquake');

// Load environment variables
dotenv.config();

const datasetPath = path.join(__dirname, 'dataset.json');

// Country extractor utility
function extractCountry(place) {
  if (!place) return 'Unknown';
  const parts = place.split(', ');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  
  // Custom fallbacks for regions represented without commas
  const lowerPlace = place.toLowerCase();
  if (lowerPlace.includes('california')) return 'United States';
  if (lowerPlace.includes('alaska')) return 'United States';
  if (lowerPlace.includes('hawaii')) return 'United States';
  if (lowerPlace.includes('puerto rico')) return 'United States';
  if (lowerPlace.includes('oregon')) return 'United States';
  if (lowerPlace.includes('washington')) return 'United States';
  if (lowerPlace.includes('nevada')) return 'United States';
  if (lowerPlace.includes('oklahoma')) return 'United States';
  if (lowerPlace.includes('idaho')) return 'United States';
  if (lowerPlace.includes('utah')) return 'United States';
  if (lowerPlace.includes('montana')) return 'United States';
  if (lowerPlace.includes('texas')) return 'United States';
  if (lowerPlace.includes('wyoming')) return 'United States';
  
  return place.trim(); // Fallback to full place name
}

// Convert empty strings to null or parse to appropriate float
const parseNumber = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const parseInteger = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const num = parseInt(val);
  return isNaN(num) ? null : num;
};

const seedData = async () => {
  try {
    console.log('[Seeding] Starting database seeding process...');

    // 1. Establish database connection
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/earthquakes';
    await mongoose.connect(connStr);
    console.log('[Seeding] MongoDB Connected for seeding.');

    // 2. Read dataset JSON
    if (!fs.existsSync(datasetPath)) {
      console.error(`[Seeding] ERROR: Dataset file not found at: ${datasetPath}`);
      console.log('[Seeding] Please ensure you downloaded dataset.json using the curl command.');
      process.exit(1);
    }

    console.log('[Seeding] Reading dataset.json file into memory...');
    const rawData = fs.readFileSync(datasetPath, 'utf8');
    const records = JSON.parse(rawData);
    console.log(`[Seeding] Loaded ${records.length} records from JSON.`);

    // 3. Cleanse and parse records to Mongoose schema standard
    console.log('[Seeding] Cleansing and parsing dataset records. Converting types...');
    const cleansedRecords = records.map((record, index) => {
      // Periodic progress logger
      if (index > 0 && index % 10000 === 0) {
        console.log(`[Seeding] Cleansed ${index} / ${records.length} records...`);
      }

      return {
        id: record.id || `custom_eq_${index}_${Date.now()}`,
        time: record.time ? new Date(record.time) : new Date(),
        latitude: parseNumber(record.latitude) || 0,
        longitude: parseNumber(record.longitude) || 0,
        depth: parseNumber(record.depth) || 0,
        mag: parseNumber(record.mag) || 0,
        magType: record.magType || 'unknown',
        nst: parseInteger(record.nst),
        gap: parseNumber(record.gap),
        dmin: parseNumber(record.dmin),
        rms: parseNumber(record.rms),
        net: record.net || 'unknown',
        updated: record.updated ? new Date(record.updated) : new Date(),
        place: record.place || 'Unknown Location',
        country: extractCountry(record.place),
        type: record.type || 'earthquake',
        horizontalError: parseNumber(record.horizontalError),
        depthError: parseNumber(record.depthError),
        magError: parseNumber(record.magError),
        magNst: parseInteger(record.magNst),
        status: record.status || 'automatic',
        locationSource: record.locationSource || 'unknown',
        magSource: record.magSource || 'unknown',
        isDeleted: false
      };
    });

    console.log('[Seeding] Database cleaning: purging existing Earthquake collection...');
    await Earthquake.deleteMany({});
    console.log('[Seeding] Earthquake collection successfully purged.');

    // 4. Perform bulk insert in chunks for memory safety
    const chunkMapSize = 5000;
    console.log(`[Seeding] Initiating bulk database inserts in batches of ${chunkMapSize}...`);
    
    for (let i = 0; i < cleansedRecords.length; i += chunkMapSize) {
      const chunk = cleansedRecords.slice(i, i + chunkMapSize);
      await Earthquake.insertMany(chunk, { ordered: false });
      console.log(`[Seeding] Inserted records batch: ${Math.min(i + chunkMapSize, cleansedRecords.length)} / ${cleansedRecords.length}`);
    }

    // 5. Force create text index and general indexes
    console.log('[Seeding] Creating schema indexes on MongoDB...');
    await Earthquake.syncIndexes();
    console.log('[Seeding] Indexes successfully built.');

    console.log('\x1b[32m%s\x1b[0m', `[Seeding] SUCCESS: Database seeded successfully with ${cleansedRecords.length} records!`);
    
    // Close connection cleanly
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `[Seeding] CRITICAL ERROR occurred during database seeding: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

// Start execution
seedData();
