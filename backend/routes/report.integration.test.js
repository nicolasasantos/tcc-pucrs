const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// --- Configuration Setup ---
// Load environment variables for the test database URI
const envPath = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

// Import Report and Category models and the Report routes
const reportRoutes = require('../routes/report');
const Report = require('../models/Report');
// Assuming the Category model file exists in ../models/Category.js
const Category = require('../models/Category');

// The App Setup
const app = express();
app.use(express.json());
// Mount the reports router
app.use('/reports', reportRoutes);

// Database Connection Details
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_CLUSTER_HOST = process.env.DB_CLUSTER_HOST;
const DB_APP_NAME = process.env.DB_APP_NAME;

// NOTE: The URI uses the existing environment variables.
const TEST_URI = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_CLUSTER_HOST}/?appName=${DB_APP_NAME}`;

// Variables to hold test data
let testCategory;
let testReport;

// --- Test Suite Lifecycle Hooks ---

// Connect to the database before all tests
beforeAll(async () => {
  if (!TEST_URI) {
    throw new Error('Database URI is not defined. Please check your .env file.');
  }
  await mongoose.connect(TEST_URI);
});

// Disconnect after all tests
afterAll(async () => {
  // Final cleanup of any lingering documents created in setup
  await Report.deleteMany({});
  await Category.deleteMany({});
  await mongoose.connection.close();
});

// Clean the database and create necessary test entries before EACH test
beforeEach(async () => {
  // 1. Clean the entire collections to ensure a clean slate for isolation
  await Report.deleteMany({});
  await Category.deleteMany({});

  // 2. Create a fresh Category, as it's required for a Report
  testCategory = await Category.create({
    name: 'Test Category',
    description: 'Used for report tests',
  });

  // 3. Create a fresh Report to test GET, PUT, and DELETE routes
  const reportData = {
    category: testCategory._id,
    title: 'Initial Test Report',
    description: 'This is the report for testing CRUD operations.',
    location: {
      latitude: 40.7128,
      longitude: -74.006,
    },
    name: 'Reporter Name',
    severity: 'medium',
  };
  testReport = await Report.create(reportData);
});

// --- Test Suite for Report Routes (Integration Test) ---

describe('Report Routes (Integration Test)', () => {
  // --- GET /reports ---
  describe('GET /reports', () => {
    it('should return all reports, including the test one, with status 200 and populated category', async () => {
      const res = await request(app).get('/reports');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1); // Only the one created in beforeEach should exist

      const report = res.body[0];
      expect(report.title).toBe('Initial Test Report');
      // Verify Category is populated (it should be an object, not just an ID)
      expect(report.category).toHaveProperty('name', 'Test Category');
    });
  });

  // --- GET /reports/:id ---
  describe('GET /reports/:id', () => {
    it('should return the test report by ID with status 200 and populated category', async () => {
      const res = await request(app).get(`/reports/${testReport._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Initial Test Report');
      expect(res.body._id.toString()).toBe(testReport._id.toString());
      expect(res.body.category).toHaveProperty('name', 'Test Category');
    });

    it('should return 404 if report is not found', async () => {
      const nonExistentId = '60c72b2f9f1b2c0015b8b8f9'; // A valid-looking but non-existent ID

      const res = await request(app).get(`/reports/${nonExistentId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Report not found');
    });

    it('should return 500 for an invalid ID format', async () => {
      const res = await request(app).get(`/reports/invalid-id`);

      // Mongoose/MongoDB will throw an error for a bad ID format
      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('message', 'An error occured while fetching the report');
    });
  });

  // --- POST /reports ---
  describe('POST /reports', () => {
    const newReportData = {
      // Use the ID created in the beforeEach hook
      category: null,
      title: 'New Post Report',
      description: 'Report created via POST test',
      location: {
        latitude: 34.0522,
        longitude: -118.2437,
      },
      name: 'Test Poster',
      severity: 'high',
    };

    beforeEach(() => {
      // Set the category ID just before the test runs
      newReportData.category = testCategory._id.toString();
    });

    it('should successfully create a new report and return 201', async () => {
      const res = await request(app).post('/reports').send(newReportData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe(newReportData.title);
      expect(res.body.vote_fix).toBe(0); // Check default value

      // Verify it was actually saved to the DB
      const savedReport = await Report.findById(res.body._id);
      expect(savedReport.title).toBe(newReportData.title);
    });

    it('should return 500 if required fields are missing', async () => {
      const incompleteData = {
        category: newReportData.category,
        location: newReportData.location,
        name: 'Incomplete Test',
        severity: 'low',
        // 'title' and 'description' are missing
      };

      const res = await request(app).post('/reports').send(incompleteData);

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('message', 'Failed to create report');
      // Check for specific schema validation error message
      expect(res.body.error).toMatch(/Path `title` is required/);
    });

    it('should return 500 for an invalid severity enum value', async () => {
      const invalidData = { ...newReportData, severity: 'critical' };

      const res = await request(app).post('/reports').send(invalidData);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toMatch(/`critical` is not a valid enum value/);
    });
  });

  // --- PUT /reports/:id ---
  describe('PUT /reports/:id', () => {
    it('should successfully update a report and return 200', async () => {
      const updates = { title: 'Updated Report Title', vote_fix: 5, severity: 'low' };

      const res = await request(app).put(`/reports/${testReport._id}`).send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe(updates.title);
      expect(res.body.vote_fix).toBe(updates.vote_fix);
      expect(res.body.category.name).toBe('Test Category');

      // Verify the change in the database
      const updatedInDB = await Report.findById(testReport._id);
      expect(updatedInDB.title).toBe(updates.title);
    });

    it('should return 404 if the report to update is not found', async () => {
      const nonExistentId = '60c72b2f9f1b2c0015b8b8f9';
      const res = await request(app)
        .put(`/reports/${nonExistentId}`)
        .send({ title: 'Should Fail' });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Report not found');
    });

    it('should return 500 for an invalid update (e.g., bad enum value)', async () => {
      const invalidUpdates = { severity: 'critical' };

      const res = await request(app).put(`/reports/${testReport._id}`).send(invalidUpdates);

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('message', 'Failed to update report');
      expect(res.body.error).toMatch(/Cast to string failed for value "critical"/);
    });
  });

  // --- DELETE /reports/:id ---
  describe('DELETE /reports/:id', () => {
    // Create a new report just for this test, so we can verify the deletion without affecting testReport
    let deleteTargetId;

    beforeEach(async () => {
      const disposableReport = await Report.create({
        category: testCategory._id,
        title: 'Disposable Report',
        description: 'To be deleted',
        location: { latitude: 1, longitude: 1 },
        name: 'Disposable',
        severity: 'low',
      });
      deleteTargetId = disposableReport._id;
    });

    it('should successfully delete a report and return 200', async () => {
      const res = await request(app).delete(`/reports/${deleteTargetId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Report deleted successfully');

      // Verify the report is gone from the database
      const deletedReport = await Report.findById(deleteTargetId);
      expect(deletedReport).toBeNull();
    });

    it('should return 404 if the report to delete is not found', async () => {
      const nonExistentId = '60c72b2f9f1b2c0015b8b8f9';

      const res = await request(app).delete(`/reports/${nonExistentId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Report not found');
    });
  });
});
