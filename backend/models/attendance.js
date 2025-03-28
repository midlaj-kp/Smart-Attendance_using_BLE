const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
    reg_no: { type: String, required: true, ref: "Student" },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ["Present", "Absent"], required: true, default: "Absent" },
});

  
const Attendance = mongoose.model("Attendance", AttendanceSchema);
module.exports = Attendance;