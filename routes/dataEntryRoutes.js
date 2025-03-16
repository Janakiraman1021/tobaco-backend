const express = require("express");
const { z } = require("zod");
const DataEntry = require("../models/DataEntry");

const router = express.Router();

// Data validation schema
const dataEntrySchema = z.object({
  institutionName: z.string().min(1, 'Institution name is required'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  name: z.string().min(1, 'Name is required'),
  sampleId: z.number().positive('Sample ID must be a positive number'),
  userType: z.enum(['Non-user', 'Regular User', 'Addict']),
  timeMins: z.number().min(0).max(60),
  phLevel: z.number().min(1).max(14),
  conductivity: z.number().min(0),
  temperature: z.number(),
  substanceDetected: z.string().min(1, 'Substance detected is required')
});

// Add a new sample entry (Public route)
router.post("/entry", async (req, res) => {
  try {
    // Generate a unique sample ID
    const lastEntry = await DataEntry.findOne().sort({ sampleId: -1 });
    const nextSampleId = lastEntry ? lastEntry.sampleId + 1 : 1;

    // Validate request body
    const validatedData = dataEntrySchema.parse({
      ...req.body,
      sampleId: nextSampleId
    });

    // Create new entry
    const newData = new DataEntry({
      ...validatedData,
      createdBy: req.user?.id || '65f91b89c5521e84a2df8e15' // Use a default admin ID for public entries
    });
    
    await newData.save();

    res.status(201).json({
      success: true,
      message: "Data Entered Successfully",
      data: newData
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.errors
      });
    }

    console.error('Error creating entry:', err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
});

module.exports = router;
