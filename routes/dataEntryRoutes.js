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
  timeMins: z.number().min(0).max(60),
  phLevel: z.number().min(1).max(14),
  temperature: z.number(),
  Nicotene: z.number().optional(),
  substanceDetected: z.string().optional(),
  userType: z.enum(['Non-user', 'Regular User', 'Addict']).optional()
});

// Function to determine user type
const determineUserType = (phLevel, Nicotene) => {
  if (phLevel > 7.5 && Nicotene > 150) return 'Addict';
  if (phLevel >= 7 && phLevel <= 7.5 && Nicotene >= 130 && Nicotene <= 150) return 'Regular User';
  if (phLevel >= 7.3 && phLevel <= 7.5 && Nicotene >= 120 && Nicotene <= 130) return 'Intermediate User';
  return 'Non-user';
};

// Add a new sample entry (Public route)
router.post("/entry", async (req, res) => {
  try {
    // Generate a unique sample ID
    const lastEntry = await DataEntry.findOne().sort({ sampleId: -1 });
    const nextSampleId = lastEntry ? lastEntry.sampleId + 1 : 1;

    // Determine user type
    const userType = determineUserType(req.body.phLevel, req.body.Nicotene);

    // Validate request body
    const validatedData = dataEntrySchema.parse({
      ...req.body,
      sampleId: nextSampleId,
      userType
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

/**
 * Classification Criteria:
 * - Addict: pH level above 7.5 and nicotine level above 150.
 * - Regular User: pH level between 7 - 7.5 and nicotine level between 130 - 150.
 * - Intermediate User: pH level between 7.3 - 7.5 and nicotine level between 120 - 130.
 */
