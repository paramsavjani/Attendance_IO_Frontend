import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, User, ChevronLeft } from "lucide-react";
import { SubjectCard } from "@/components/attendance/SubjectCard";

// Mock student data with detailed subject attendance
const mockStudents = [
  { 
    id: "1", 
    name: "Rahul Sharma", 
    rollNumber: "CS2021001", 
    semester: 5,
    subjects: [
      { name: "Data Structures", code: "CS301", color: "234 89% 64%", present: 18, absent: 4, total: 22 },
      { name: "Database Systems", code: "CS302", color: "142 72% 45%", present: 20, absent: 2, total: 22 },
      { name: "Operating Systems", code: "CS303", color: "43 96% 56%", present: 15, absent: 7, total: 22 },
      { name: "Computer Networks", code: "CS304", color: "0 72% 51%", present: 19, absent: 3, total: 22 },
      { name: "Software Engineering", code: "CS305", color: "280 72% 55%", present: 17, absent: 5, total: 22 },
    ]
  },
  { 
    id: "2", 
    name: "Priya Patel", 
    rollNumber: "CS2021002", 
    semester: 5,
    subjects: [
      { name: "Data Structures", code: "CS301", color: "234 89% 64%", present: 21, absent: 1, total: 22 },
      { name: "Database Systems", code: "CS302", color: "142 72% 45%", present: 20, absent: 2, total: 22 },
      { name: "Operating Systems", code: "CS303", color: "43 96% 56%", present: 19, absent: 3, total: 22 },
      { name: "Computer Networks", code: "CS304", color: "0 72% 51%", present: 20, absent: 2, total: 22 },
      { name: "Software Engineering", code: "CS305", color: "280 72% 55%", present: 18, absent: 4, total: 22 },
    ]
  },
  { 
    id: "3", 
    name: "Amit Kumar", 
    rollNumber: "CS2021003", 
    semester: 5,
    subjects: [
      { name: "Data Structures", code: "CS301", color: "234 89% 64%", present: 12, absent: 10, total: 22 },
      { name: "Database Systems", code: "CS302", color: "142 72% 45%", present: 14, absent: 8, total: 22 },
      { name: "Operating Systems", code: "CS303", color: "43 96% 56%", present: 16, absent: 6, total: 22 },
      { name: "Computer Networks", code: "CS304", color: "0 72% 51%", present: 13, absent: 9, total: 22 },
      { name: "Software Engineering", code: "CS305", color: "280 72% 55%", present: 15, absent: 7, total: 22 },
    ]
  },
  { 
    id: "4", 
    name: "Sneha Singh", 
    rollNumber: "CS2021004", 
    semester: 5,
    subjects: [
      { name: "Data Structures", code: "CS301", color: "234 89% 64%", present: 17, absent: 5, total: 22 },
      { name: "Database Systems", code: "CS302", color: "142 72% 45%", present: 18, absent: 4, total: 22 },
      { name: "Operating Systems", code: "CS303", color: "43 96% 56%", present: 16, absent: 6, total: 22 },
      { name: "Computer Networks", code: "CS304", color: "0 72% 51%", present: 19, absent: 3, total: 22 },
      { name: "Software Engineering", code: "CS305", color: "280 72% 55%", present: 15, absent: 7, total: 22 },
    ]
  },
  { 
    id: "5", 
    name: "Vikram Mehta", 
    rollNumber: "CS2021005", 
    semester: 5,
    subjects: [
      { name: "Data Structures", code: "CS301", color: "234 89% 64%", present: 20, absent: 2, total: 22 },
      { name: "Database Systems", code: "CS302", color: "142 72% 45%", present: 19, absent: 3, total: 22 },
      { name: "Operating Systems", code: "CS303", color: "43 96% 56%", present: 18, absent: 4, total: 22 },
      { name: "Computer Networks", code: "CS304", color: "0 72% 51%", present: 17, absent: 5, total: 22 },
      { name: "Software Engineering", code: "CS305", color: "280 72% 55%", present: 21, absent: 1, total: 22 },
    ]
  },
  { 
    id: "6", 
    name: "Anjali Gupta", 
    rollNumber: "CS2021006", 
    semester: 5,
    subjects: [
      { name: "Data Structures", code: "CS301", color: "234 89% 64%", present: 15, absent: 7, total: 22 },
      { name: "Database Systems", code: "CS302", color: "142 72% 45%", present: 16, absent: 6, total: 22 },
      { name: "Operating Systems", code: "CS303", color: "43 96% 56%", present: 14, absent: 8, total: 22 },
      { name: "Computer Networks", code: "CS304", color: "0 72% 51%", present: 17, absent: 5, total: 22 },
      { name: "Software Engineering", code: "CS305", color: "280 72% 55%", present: 18, absent: 4, total: 22 },
    ]
  },
];

type Student = typeof mockStudents[0];

export default function Search() {
  const [query, setQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const filteredStudents = query.length > 0
    ? mockStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.rollNumber.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  if (selectedStudent) {
    return (
      <AppLayout>
        <div className="space-y-4">
          {/* Back button */}
          <button
            onClick={() => setSelectedStudent(null)}
            className="flex items-center gap-2 text-muted-foreground text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {/* Student Header */}
          <div className="pb-2 border-b border-border">
            <h1 className="text-lg font-bold">{selectedStudent.name}</h1>
            <p className="text-sm text-muted-foreground">{selectedStudent.rollNumber}</p>
          </div>

          {/* Subject Cards */}
          <div className="space-y-2">
            {selectedStudent.subjects.map((subject, index) => (
              <SubjectCard
                key={index}
                name={subject.name}
                code={subject.code}
                color={subject.color}
                present={subject.present}
                absent={subject.absent}
                total={subject.total}
                minRequired={70}
                defaultExpanded={true}
              />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or roll number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 py-6 text-base rounded-xl bg-card border-border"
          />
        </div>

        {/* Results */}
        {query.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <SearchIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Search for any student</p>
          </div>
        )}

        {query.length > 0 && filteredStudents.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">No students found</p>
          </div>
        )}

        {filteredStudents.length > 0 && (
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 text-left w-full active:scale-98 transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
