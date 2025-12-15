require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 8080;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const reportRoutes = require('./routes/report');
const categoryRoutes = require('./routes/category');

// Use routes
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.listen(PORT, (error) => {
  if (!error) {
    console.log(`Server is running on port ${PORT}`);
  } else {
    console.error('Error starting server:', error);
  }
});

// MongoDB connection
main().catch((err) => console.error(err));

async function main() {
  const DB_USER = process.env.DB_USER;
  const DB_PASSWORD = process.env.DB_PASSWORD;
  const DB_CLUSTER_HOST = process.env.DB_CLUSTER_HOST;
  const DB_APP_NAME = process.env.DB_APP_NAME;

  const connectionString = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_CLUSTER_HOST}/?appName=${DB_APP_NAME}`;

  try {
    await mongoose.connect(connectionString);
    mongoose.set('strictQuery', true);
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Exit process with failure
    process.exit(1);
  }
}
