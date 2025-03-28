
const express = require("express");
const connectDB = require("./db");
const Student = require("./models/student");
const Attendance = require("./models/attendance");
const cors = require("cors");

const app = express();
connectDB();
app.use(express.json());
app.use(cors());



app.post("/api/attendance/mac", async (req, res) => {
    try {
        const mac = req.body.mac_address;
        if (!mac) return res.status(400).json({ message: "MAC address is required" });

        const candidate = await Student.findOne({ "mac_address": mac });
        if (!candidate) return res.status(404).json({ message: "Student not found" });

        const date = new Date().toISOString().split('T')[0];
        const time = new Date().getHours();


        const existingAttendance = await Attendance.findOne({
            reg_no: candidate.reg_no,
            date: date,
            time: time
        });

        if (existingAttendance) {
            existingAttendance.status = "Present";
            await existingAttendance.save();
        } else {
            const attendance = new Attendance({
                reg_no: candidate.reg_no,
                date,
                time,
                status: "Present"
            });
            await attendance.save();
        }

        res.status(201).json({ message: "Attendance recorded" });
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
                filter: { reg_no, date }, // Removed `time` to ensure the same student isn't marked multiple times a day
                update: { $set: { status, time } }, // Now updating `time` as well
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
                $project: {
                    _id: 0,
                    reg_no: 1,
                    name: 1,
                    section: 1,
                    attendance: {
                        date: 1,
                        time: 1,
                        status: 1
                    }
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



