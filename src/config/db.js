const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env variables if not already loaded
dotenv.config();

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/earthquakes';
    
    if (process.env.DEBUG === 'true') {
      console.log(`[Database] Connecting to: ${connStr.replace(/:([^:@]+)@/, ':****@')}`);
    }

    const conn = await mongoose.connect(connStr, {
      autoIndex: true, // Auto-build indexes defined in schemas
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    
    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error(`[Database] Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] Mongoose disconnected from MongoDB');
    });

  } catch (error) {
    console.error(`[Database] Initial MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

// Graceful shutdown handler
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('[Database] Mongoose connection closed due to app termination');
    process.exit(0);
  } catch (err) {
    console.error(`[Database] Error during graceful shutdown: ${err.message}`);
    process.exit(1);
  }
});

module.exports = connectDB;
