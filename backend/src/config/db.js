import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod = null;

export const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/syncpad';

    // If connection is local, try connecting with a short timeout.
    // If it fails, spin up the memory server fallback automatically.
    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      try {
        console.log(`[Database] Attempting connection to local MongoDB: ${uri}`);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
        console.log('[Database] Connected to local MongoDB.');
        return;
      } catch (err) {
        console.log('[Database] Local MongoDB connection failed or service not running.');
        console.log('[Database] Initializing MongoDB Memory Server sandbox fallback...');
        mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        console.log(`[Database] MongoDB Memory Server running at: ${uri}`);
      }
    }

    await mongoose.connect(uri);
    console.log(`[Database] Connected to database: ${uri}`);
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
    console.log('[Database] Disconnected successfully.');
  } catch (error) {
    console.error('[Database] Disconnection error:', error);
  }
};
