const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({ 
  reg_no : {type: String, required: true },
  name: { type: String, required: true },
  phone_number: { type: String, required: true },
  email: { type: String, required: true },
  section: { type: String, required: true },
  mac_address: { type: String, required: true, unique: true },
});

const Student = mongoose.model("Student", StudentSchema);
module.exports = Student;