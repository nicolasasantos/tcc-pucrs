const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

//GET all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'An error occured while fetching the categories', error: err.message });
  }
});

//GET a category by ID
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const category = await Category.findById({ _id: id });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'An error occured while fetching the category', error: err.message });
  }
});

//POST a new category
router.post('/', async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create category', error: err.message });
  }
});

//PUT update a category by ID
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const customerUpdates = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
      { _id: id },
      { $set: customerUpdates },
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(updatedCategory);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update category', error: err.message });
  }
});

//DELETE a category by ID
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deletedCategory = await Category.findByIdAndDelete({ _id: id });
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category', error: err.message });
  }
});

module.exports = router;
