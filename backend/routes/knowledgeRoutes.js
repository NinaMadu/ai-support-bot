const express = require('express');
const router = express.Router();
const Knowledge = require('../models/Knowledge');
const { generateEmbedding } = require('../utils/embeddings');

// Get all knowledge entries
router.get('/', async (req, res) => {
    try {
        const entries = await Knowledge.find().sort({ createdAt: -1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add new knowledge entry
router.post('/', async (req, res) => {
    const { content, metadata } = req.body;
    try {
        const embedding = await generateEmbedding(content);
        const newEntry = new Knowledge({
            content,
            embedding,
            metadata,
        });
        const savedEntry = await newEntry.save();
        res.status(201).json(savedEntry);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete knowledge entry
router.delete('/:id', async (req, res) => {
    try {
        await Knowledge.findByIdAndDelete(req.params.id);
        res.json({ message: 'Knowledge entry deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
