const express = require('express');
const router = express.Router();
const DataEntry = require('../models/DataEntry');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Fetch all data (Only admin)
router.get("/", authMiddleware("admin"), async (req, res) => {
    try {
        const data = await DataEntry.find()
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        if (!data || data.length === 0) {
            return res.status(404).json({ message: "No entries found" });
        }

        res.status(200).json({
            success: true,
            count: data.length,
            data: data
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Fetch all data entry users (Public route - No authentication needed)
router.get("/data-entry-users", async (req, res) => {
    try {
        const users = await User.find({ role: "data_entry" })
            .select("name email createdAt")  // Only select necessary fields
            .sort({ createdAt: -1 });

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No data entry users found"
            });
        }

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Error fetching data entry users:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Fetch all entries (Public route)
router.get("/all-entries", async (req, res) => {
    try {
        const entries = await DataEntry.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        if (!entries || entries.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No entries found"
            });
        }

        // Format the response data
        const formattedEntries = entries.map(entry => ({
            _id: entry._id,
            institutionName: entry.institutionName,
            rollNumber: entry.rollNumber,
            name: entry.name,
            sampleId: entry.sampleId,
            userType: entry.userType,
            timeMins: entry.timeMins,
            phLevel: entry.phLevel,
            conductivity: entry.conductivity,
            temperature: entry.temperature,
            substanceDetected: entry.substanceDetected,
            createdBy: entry.createdBy,
            createdAt: entry.createdAt
        }));

        res.status(200).json({
            success: true,
            count: entries.length,
            data: formattedEntries
        });
    } catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Add new data entry (Both admin and data_entry roles can access)
router.post("/", authMiddleware(["admin", "data_entry"]), async (req, res) => {
    try {
        const newEntry = new DataEntry({
            ...req.body,
            createdBy: req.user.id
        });

        await newEntry.save();

        res.status(201).json({
            success: true,
            message: "Entry created successfully",
            data: newEntry
        });
    } catch (error) {
        console.error('Error creating entry:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Delete an entry (Only admin)
router.delete("/:id", authMiddleware("admin"), async (req, res) => {
    try {
        const entry = await DataEntry.findById(req.params.id);
        
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "Entry not found"
            });
        }

        await DataEntry.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            success: true,
            message: "Entry deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

module.exports = router;
