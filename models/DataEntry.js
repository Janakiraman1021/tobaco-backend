const mongoose = require("mongoose");

const DataEntrySchema = new mongoose.Schema({
  institutionName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  name: { type: String, required: true },
  sampleId: { type: Number, required: true, unique: true },
  userType: { type: String, enum: ["Non-user", "Regular User", "Addict"], required: true },
  timeMins: { type: Number, required: true },
  phLevel: { type: Number, required: true },
  Nicotene: { type: Number, required: false },
  temperature: { type: Number, required: true },
  substanceDetected: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DataEntry", DataEntrySchema);