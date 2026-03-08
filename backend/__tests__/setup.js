// jest setup file for backend tests
const mongoose = require('mongoose');

require('dotenv').config({ path: '.env.test' });

// set test environment variables
process.env.NODE_ENV = 'test';

// increase timeout for database operations (Atlas connection may take longer)
jest.setTimeout(30000);

// global setup to clear the test database before all tests
beforeAll(async () => {
  // connect to test database if not already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.DATABASE_URI);
  }

  // clear all collections before starting tests
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

// global cleanup after all tests
afterAll(async () => {
  // close mongoose connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
