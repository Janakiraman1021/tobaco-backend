const express = require("express");
const { z } = require("zod");
const DataEntry = require("../models/DataEntry");

const router = express.Router();

// Validation schema
const dataEntrySchema = z.object({
  institutionName: z.string().min(1, "Institution name is required"),
  rollNumber: z.string().min(1, "Roll number is required"),
  name: z.string().min(1, "Name is required"),
  timeMins: z.number().min(0).max(60),
  phLevel: z.number().min(1).max(14),
  Nicotene: z.number().optional(),
  temperature: z.number(),
  substanceDetected: z.string().optional(),
});

// Function to determine user type
function determineUserType(phLevel, Nicotene) {
  if (phLevel > 7.5 && Nicotene > 150) {
    return "Addict";
  } else if ((phLevel >= 7 && phLevel <= 7.5) && (Nicotene >= 130 && Nicotene <= 150)) {
    return "Regular User";
  } else if ((phLevel >= 7.3 && phLevel <= 7.5) && (Nicotene >= 120 && Nicotene <= 130)) {
    return "Regular User";
  }
  return "Non-user";
}

// Route to add data
router.post("/entry", async (req, res) => {
  try {
    // Get last sample ID and generate new one
    const lastEntry = await DataEntry.findOne().sort({ sampleId: -1 });
    const nextSampleId = lastEntry ? lastEntry.sampleId + 1 : 1;

    // Validate request data
    const validatedData = dataEntrySchema.parse(req.body);

    // Determine user type
    const userType = determineUserType(validatedData.phLevel, validatedData.Nicotene);

    // Create new entry
    const newData = new DataEntry({
      ...validatedData,
      sampleId: nextSampleId,
      userType,
      createdBy: req.user?.id || "65f91b89c5521e84a2df8e15",
    });

    await newData.save();

    res.status(201).json({
      success: true,
      message: "Data Entered Successfully",
      data: newData,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.errors,
      });
    }
    console.error("Error creating entry:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

module.exports = router;
