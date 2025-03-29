const mongoose = require("mongoose");

const HeadcountSchema = new mongoose.Schema({
    count: { type: Number, default: 0 }, // Default headcount is 0
    timestamp: { type: Date, default: Date.now },
  });

  const Headcount = mongoose.model("Headcount", HeadcountSchema);
  module.exports = Headcount;