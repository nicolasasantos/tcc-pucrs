const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

//GET all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().populate('category');
    res.status(200).json(reports);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'An error occured while fetching the reports', error: err.message });
  }
});

//GET a report by ID
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const report = await Report.findById({ _id: id }).populate('category');
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(200).json(report);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'An error occured while fetching the report', error: err.message });
  }
});

//POST a new report
router.post('/', async (req, res) => {
  try {
    const newReport = new Report(req.body);
    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create report', error: err.message });
  }
});

//PUT update a report by ID
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const customerUpdates = req.body;
    const updatedReport = await Report.findByIdAndUpdate(
      { _id: id },
      { $set: customerUpdates },
      { new: true, runValidators: true }
    );
    if (!updatedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(200).json(updatedReport);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update report', error: err.message });
  }
});

//DELETE a report by ID
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deletedReport = await Report.findByIdAndDelete({ _id: id });
    if (!deletedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete report', error: err.message });
  }
});

module.exports = router;
