import { useState, useEffect } from "react";

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/students/attendance");
      const data = await response.json();
      setStudents(
        data.map(student => ({
          ...student,
          status: student.attendance?.[0]?.status || "Absent" // Default to "Absent" if no attendance record
        }))
      );
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = (reg_no) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.reg_no === reg_no
          ? { ...student, status: student.status === "Present" ? "Absent" : "Present" }
          : student
      )
    );
  };

  const markAllAttendance = async () => {
    try {
      const updatedAttendance = students.map(({ reg_no, status }) => ({
        reg_no,
        date: new Date().toISOString().split("T")[0], // Current Date
        time: new Date().getHours(), // Current Hour
        status
      }));

      const response = await fetch("http://localhost:5000/api/mark-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: updatedAttendance })
      });

      if (response.ok) {
        alert("Attendance updated successfully!");
      } else {
        alert("Failed to update attendance.");
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };

  return (
    <div className="min-h-screen h-screen flex flex-col bg-gray-100 text-gray-900 p-6">
      <div className="flex justify-between items-center mb-6">
        <button onClick={fetchStudents} className="p-2 bg-blue-500 text-white rounded">
          🔄 Refresh
        </button>
        <h1 className="text-3xl font-bold">Attendance Marker</h1>
      </div>

      <div className="flex gap-6 mb-4">
        <p className="text-lg">Total Students: {students.length}</p>
        <p className="text-lg">Present: {students.filter((s) => s.status === "Present").length}</p>
      </div>

      <div className="flex-grow bg-white shadow-md rounded-lg p-4 overflow-x-auto">
        {loading ? (
          <p className="text-center text-lg font-semibold">Loading...</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-2">Reg No</th>
                <th className="p-2">Name</th>
                <th className="p-2">Section</th>
                <th className="p-2">Status</th>
                <th className="p-2">Mark</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.reg_no} className={`${student.status === "Absent" ? "bg-red-100" : ""} border-b`}>
                  <td className="p-2">{student.reg_no}</td>
                  <td className="p-2">{student.name}</td>
                  <td className="p-2">{student.section}</td>
                  <td className="p-2">{student.status}</td>
                  <td className="p-2">
                  {student.status === "Present" ? 
                  <button className="p-1 bg-red-600 text-white rounded w-24"
                      type="button"
                      onClick={() => markAttendance(student.reg_no)}
                    >
                      Absent
                  </button> : 
                  <button
                      className="p-1 bg-green-600 text-white rounded w-24"
                      type="button"
                      onClick={() => markAttendance(student.reg_no)}
                    >
                     Present
                  </button>}
                  
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={markAllAttendance}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Mark Attendance
        </button>
      </div>
    </div>
  );
}

export default App;
