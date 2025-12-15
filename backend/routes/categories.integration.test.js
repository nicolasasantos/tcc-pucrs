const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables for database URI
const envPath = path.resolve(__dirname, '..', '.env');

require('dotenv').config({ path: envPath });

// Import Category model and routes
const categoryRoutes = require('./category');
const Category = require('../models/Category');

// The App Setup
const app = express();
app.use(express.json());
app.use('/api/categories', categoryRoutes);

// Database Setup
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_CLUSTER_HOST = process.env.DB_CLUSTER_HOST;
const DB_APP_NAME = process.env.DB_APP_NAME;

const TEST_URI = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_CLUSTER_HOST}/?appName=${DB_APP_NAME}`;
let testCategory; // Variable to hold a category created for testing

// Connect to the database before all tests
beforeAll(async () => {
  if (!TEST_URI) {
    throw new Error('TEST_URI is not defined. Please check your .env file.');
  }
  await mongoose.connect(TEST_URI);
});

// Disconnect and perform a final cleanup after all tests
afterAll(async () => {
  // FINAL CLEANUP: Ensure all temporary documents are removed
  await Category.deleteMany({});
  await mongoose.connection.close();
});

// Clean the database and create a test entry before each test
beforeEach(async () => {
  await Category.deleteMany({});

  const categoryData = { name: 'Category Test' };
  testCategory = await Category.create(categoryData);
});

// The Test Suite
describe('Category Routes (Integration Test)', () => {
  // --- GET /api/categories ---
  describe('GET /api/categories', () => {
    it('should return all categories, including the test one, with status 200', async () => {
      const res = await request(app).get('/api/categories');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].name).toBe('Category Test');
    });
  });

  // --- GET /api/categories/:id ---
  describe('GET /api/categories/:id', () => {
    it('should return the test category by ID with status 200', async () => {
      const res = await request(app).get(`/api/categories/${testCategory._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Category Test');
      expect(res.body._id.toString()).toBe(testCategory._id.toString());
    });

    it('should return 404 if category is not found', async () => {
      const nonExistentId = '60c72b2f9f1b2c0015b8b8f9';
      const res = await request(app).get(`/api/categories/${nonExistentId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Category not found');
    });

    it('should return 500 for an invalid ID format', async () => {
      const res = await request(app).get(`/api/categories/invalid-id`);

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('message', 'An error occured while fetching the category');
    });
  });

  // --- POST /api/categories ---
  describe('POST /api/categories', () => {
    it('should successfully create a new category and return 201', async () => {
      const newCategoryData = { name: 'New Post Cat' };

      const res = await request(app).post('/api/categories').send(newCategoryData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe(newCategoryData.name);

      // Verify it was actually saved to the DB
      const savedCategory = await Category.findById(res.body._id);
      expect(savedCategory.name).toBe(newCategoryData.name);

      // Delete the document created in the POST test immediately
      await Category.findByIdAndDelete(res.body._id);
    });

    // Test for schema validation failure (assuming 'name' is required and missing)
    it('should return 500 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ description: 'Missing required field' });

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('message');
    });
  });

  // --- PUT /api/categories/:id ---
  describe('PUT /api/categories/:id', () => {
    it('should successfully update a category and return 200', async () => {
      const updates = { name: 'Updated Name' };

      const res = await request(app).put(`/api/categories/${testCategory._id}`).send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe(updates.name);

      // Verify the change in the database
      const updatedInDB = await Category.findById(testCategory._id);
      expect(updatedInDB.name).toBe(updates.name);
    });

    it('should return 404 if the category to update is not found', async () => {
      const nonExistentId = '60c72b2f9f1b2c0015b8b8f9';

      const res = await request(app)
        .put(`/api/categories/${nonExistentId}`)
        .send({ name: 'Should Fail' });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Category not found');
    });
  });

  // --- DELETE /api/categories/:id ---
  describe('DELETE /api/categories/:id', () => {
    let deleteTargetId;

    // Create a NEW category specifically for this delete test
    beforeEach(async () => {
      // This runs after the main beforeEach, ensuring we have two categories
      // initially, and the main testCategory is safe.
      const disposableCategory = await Category.create({ name: 'Disposable Category' });
      deleteTargetId = disposableCategory._id;
    });

    it('should successfully delete a category and return 200', async () => {
      const res = await request(app).delete(`/api/categories/${deleteTargetId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Category deleted successfully');

      // Verify the category is gone from the database
      const deletedCategory = await Category.findById(deleteTargetId);
      expect(deletedCategory).toBeNull();

      // Ensure the main testCategory is still present (for good measure)
      const mainCategory = await Category.findById(testCategory._id);
      expect(mainCategory).not.toBeNull();
    });

    it('should return 404 if the category to delete is not found', async () => {
      const nonExistentId = '60c72b2f9f1b2c0015b8b8f9';

      const res = await request(app).delete(`/api/categories/${nonExistentId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Category not found');
    });
  });
});
