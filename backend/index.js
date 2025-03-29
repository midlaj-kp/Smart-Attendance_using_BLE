
const express = require("express");
const connectDB = require("./db");
const Student = require("./models/student");
const Attendance = require("./models/attendance");
const Headcount = require("./models/headcount");
const cors = require("cors");

const app = express();
connectDB();
app.use(express.json());
app.use(cors());

app.post("/api/headcount", async (req, res) => {
    try {
      const { count } = req.body;
  
      // Update the latest headcount, or create one if it doesn't exist
      const updatedHeadcount = await Headcount.findOneAndUpdate(
        {}, // No filter condition since we only keep one document
        { count, timestamp: Date.now() },
        { new: true, upsert: true } // `upsert: true` creates the document if it doesn't exist
      );
  
      res.status(200).json({ message: "Headcount updated successfully.", headcount: updatedHeadcount });
    } catch (error) {
      res.status(500).json({ error: "Failed to update headcount." });
    }
  });
  

  app.get("/api/headcount", async (req, res) => {
    try {
      const latestHeadcount = await Headcount.findOne().sort({ timestamp: -1 });
      res.json({ count: latestHeadcount?.count || 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch headcount." });
    }
  });



app.post("/api/attendance/mac", async (req, res) => {
    try {
        const mac = req.body.mac_address;
        if (!mac) return res.status(400).json({ message: "MAC address is required" });

        // Find student by MAC address
        const candidate = await Student.findOne({ "mac_address": mac });
        if (!candidate) return res.status(404).json({ message: "Student not found" });

        // Get current date and time
        const date = new Date().toISOString().split('T')[0];
        const time = `${new Date().getHours()}:${new Date().getMinutes()}`; // Store hour & minute

        // Find existing attendance record
        let attendance = await Attendance.findOne({
            reg_no: candidate.reg_no,
            date: date,
        });

        if (attendance) {
            // Overwrite existing attendance
            attendance.time = time;
            attendance.status = "Present";
            await attendance.save();
        } else {
            // Create new attendance entry
            attendance = new Attendance({
                reg_no: candidate.reg_no,
                date,
                time,
                status: "Present"
            });
            await attendance.save();
        }

        res.status(201).json({ message: "Attendance recorded successfully" });
    } catch (error) {
        console.error("Error in attendance marking:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/api/mark-attendance", async (req, res) => {
    try {
        const { students } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ message: "Invalid or empty students array" });
        }

        const bulkOperations = students.map(({ reg_no, date, time, status }) => ({
            updateOne: {
                filter: { reg_no, date }, 
                update: { $set: { status, time } }, 
                upsert: true,
            }
        }));

        await Attendance.bulkWrite(bulkOperations);

        res.status(200).json({ success: true, message: "Attendance records updated successfully" });
    } catch (error) {
        console.error("Error updating attendance:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get("/api/students/attendance", async (req, res) => {
    try {
        const students = await Student.aggregate([
            {
                $lookup: {
                    from: "attendances",
                    localField: "reg_no",
                    foreignField: "reg_no",
                    as: "attendance"
                }
            },
            {
                $unwind: {
                    path: "$attendance",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { "attendance.date": -1 } // Sort attendance records by date in descending order
            },
            {
                $group: {
                    _id: "$reg_no",
                    name: { $first: "$name" },
                    section: { $first: "$section" },
                    latestAttendance: { $first: "$attendance" } // Pick the latest attendance
                }
            },
            {
                $project: {
                    _id: 0,
                    reg_no: "$_id",
                    name: 1,
                    section: 1,
                    latestAttendance: 1
                }
            }
        ]);

        res.json(students);
    } catch (error) {
        console.error("Error fetching students' attendance:", error);
        res.status(500).json({ message: "Server error" });
    }
});



// Add Student
app.post("/api/add-student", async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();
        res.status(201).json({ message: "Student added" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// get all Students
app.get("/api/students", async (req, res) => {
    try {
        const students = await Student.find();
        res.json({ students });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



