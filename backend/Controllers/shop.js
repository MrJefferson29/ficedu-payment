const Item = require('../Models/shop');

// Add Item Controller
const addItem = async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    const imagePaths = req.files.map(file => file.path); // Extract image paths

    // Save the new item in the database
    const newItem = await Item.create({
      name,
      price,
      description,
      category,
      author : req.user ? req.user._id : null,
      images: imagePaths,
    });

    res.status(201).json({
      message: 'Item added successfully!',
      data: newItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch all items Controller
const getAllItems = async (req, res) => {
  try {
    const items = await Item.find(); // Retrieve all items from the database
    res.status(200).json({ data: items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch a single item by ID Controller
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id); // Retrieve item by ID

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({ data: item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Item Controller
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, replaceImages } = req.body; // `replaceImages` is optional
    const newImagePaths = req.files ? req.files.map(file => file.path) : [];

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Update fields if provided
    item.name = name || item.name;
    item.price = price || item.price;
    item.description = description || item.description;
    item.category = category || item.category;

    if (replaceImages === 'true') {
      // Replace all existing images with new ones
      item.images = newImagePaths;
    } else if (newImagePaths.length > 0) {
      // Append new images to existing ones
      item.images = [...item.images, ...newImagePaths];
    }

    await item.save();

    res.status(200).json({
      message: 'Item successfully updated',
      data: item,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Delete an item by ID Controller
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findByIdAndDelete(id); // Delete item by ID

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addItem, getAllItems, getItemById, updateItem, deleteItem };
