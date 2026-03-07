const mongoose = require("mongoose");

const diagramSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  mermaidCode: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  explanation: {
    purpose: String,
    components: [String],
    relationships: [String],
    keyInsights: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Diagram", diagramSchema);
