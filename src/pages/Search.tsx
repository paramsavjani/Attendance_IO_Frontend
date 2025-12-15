import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, User, ChevronLeft, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// Mock student data with detailed subject attendance
const mockStudents = [
  { 
    id: "1", 
    name: "Rahul Sharma", 
    rollNumber: "CS2021001", 
    semester: 5,
    subjects: [
      { name: "Data Structures", code: "CS301", present: 18, absent: 4, total: 22, percentage: 81.82 },
      { name: "Database Systems", code: "CS302", present: 20, absent: 2, total: 22, percentage: 90.91 },
      { name: "Operating Systems", code: "CS303", present: 15, absent: 7, total: 22, percentage: 68.18 },
      { name: "Computer Networks", code: "CS304", present: 19, absent: 3, total: 22, percentage: 86.36 },
      { name: "Software Engineering", code: "CS305", present: 17, absent: 5, total: 22, percentage: 77.27 },
    ]
  },
  { 
    id: "2", 
    name: "Priya Patel", 
    rollNumber: "CS2021002", 
    semester: 5,
    subjects: [
      { name: "Data Structures", code: "CS301", present: 21, absent: 1, total: 22, percentage: 95.45 },
      { name: "Database Systems", code: "CS302", present: 20, absent: 2, total: 22, percentage: 90.91 },
      { name: "Operating Systems", code: "CS303", present: 19, absent: 3, total: 22, percentage: 86.36 },
      { name: "Computer Networks", code: "CS304", present: 20, absent: 2, total: 22, percentage: 90.91 },
      { name: "Software Engineering", code: "CS305", present: 18, absent: 4, total: 22, percentage: 81.82 },
    ]
  },
  { 
    id: "3", 
    name: "Amit Kumar", 
    rollNumber: "CS2021003", 
    semester: 5,
    subjects: [
      { name: "Data Structures", code: "CS301", present: 12, absent: 10, total: 22, percentage: 54.55 },
      { name: "Database Systems", code: "CS302", present: 14, absent: 8, total: 22, percentage: 63.64 },
      { name: "Operating Systems", code: "CS303", present: 16, absent: 6, total: 22, percentage: 72.73 },
      { name: "Computer Networks", code: "CS304", present: 13, absent: 9, total: 22, percentage: 59.09 },
      { name: "Software Engineering", code: "CS305", present: 15, absent: 7, total: 22, percentage: 68.18 },
    ]
  },
  { 
    id: "4", 
    name: "Sneha Singh", 
    rollNumber: "CS2021004", 
    semester: 5,
    subjects: [
      { name: "Data Structures", code: "CS301", present: 17, absent: 5, total: 22, percentage: 77.27 },
      { name: "Database Systems", code: "CS302", present: 18, absent: 4, total: 22, percentage: 81.82 },
      { name: "Operating Systems", code: "CS303", present: 16, absent: 6, total: 22, percentage: 72.73 },
      { name: "Computer Networks", code: "CS304", present: 19, absent: 3, total: 22, percentage: 86.36 },
      { name: "Software Engineering", code: "CS305", present: 15, absent: 7, total: 22, percentage: 68.18 },
    ]
  },
  { 
    id: "5", 
    name: "Vikram Mehta", 
    rollNumber: "CS2021005", 
    semester: 5,
    subjects: [
      { name: "Data Structures", code: "CS301", present: 20, absent: 2, total: 22, percentage: 90.91 },
      { name: "Database Systems", code: "CS302", present: 19, absent: 3, total: 22, percentage: 86.36 },
      { name: "Operating Systems", code: "CS303", present: 18, absent: 4, total: 22, percentage: 81.82 },
      { name: "Computer Networks", code: "CS304", present: 17, absent: 5, total: 22, percentage: 77.27 },
      { name: "Software Engineering", code: "CS305", present: 21, absent: 1, total: 22, percentage: 95.45 },
    ]
  },
  { 
    id: "6", 
    name: "Anjali Gupta", 
    rollNumber: "CS2021006", 
    semester: 5,
    subjects: [
      { name: "Data Structures", code: "CS301", present: 15, absent: 7, total: 22, percentage: 68.18 },
      { name: "Database Systems", code: "CS302", present: 16, absent: 6, total: 22, percentage: 72.73 },
      { name: "Operating Systems", code: "CS303", present: 14, absent: 8, total: 22, percentage: 63.64 },
      { name: "Computer Networks", code: "CS304", present: 17, absent: 5, total: 22, percentage: 77.27 },
      { name: "Software Engineering", code: "CS305", present: 18, absent: 4, total: 22, percentage: 81.82 },
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

  const getOverallAttendance = (student: Student) => {
    const total = student.subjects.reduce((acc, s) => acc + s.present, 0);
    const totalClasses = student.subjects.reduce((acc, s) => acc + s.total, 0);
    return Math.round((total / totalClasses) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-success";
    if (percentage >= 60) return "bg-warning";
    return "bg-destructive";
  };

  const getClassesToReach70 = (present: number, total: number) => {
    const target = 0.70;
    const currentPercentage = present / total;
    if (currentPercentage >= target) {
      const canBunk = Math.floor((present - target * total) / target);
      return { type: 'safe', count: canBunk };
    }
    let needed = 0;
    let futurePresent = present;
    let futureTotal = total;
    while ((futurePresent / futureTotal) < target) {
      needed++;
      futurePresent++;
      futureTotal++;
    }
    return { type: 'need', count: needed };
  };

  if (selectedStudent) {
    const overall = getOverallAttendance(selectedStudent);
    return (
      <AppLayout>
        <div className="space-y-4">
          {/* Back button */}
          <button
            onClick={() => setSelectedStudent(null)}
            className="flex items-center gap-2 text-muted-foreground text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to search
          </button>

          {/* Student Header */}
          <div className="pb-2 border-b border-border">
            <h1 className="text-lg font-bold uppercase">{selectedStudent.name}</h1>
            <p className="text-sm text-muted-foreground">ID: {selectedStudent.rollNumber}</p>
          </div>

          {/* Subject Cards Grid */}
          <div className="grid grid-cols-1 gap-3">
            {selectedStudent.subjects.map((subject, index) => {
              const status = getClassesToReach70(subject.present, subject.total);
              return (
                <div
                  key={index}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  {/* Subject Name & Code */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{subject.name}</h3>
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded mt-1 inline-block">
                        {subject.code}
                      </span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Present</p>
                      <p className="text-lg font-bold text-success">{subject.present}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Absent</p>
                      <p className="text-lg font-bold text-destructive">{subject.absent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold">{subject.total}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Attendance</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-bold",
                          subject.percentage >= 75 ? "text-success" : 
                          subject.percentage >= 60 ? "text-warning" : "text-destructive"
                        )}>
                          {subject.percentage.toFixed(2)}%
                        </span>
                        {subject.percentage < 70 && (
                          <span className="text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">
                            Below 70%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", getProgressColor(subject.percentage))}
                        style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className={cn(
                    "p-2 rounded-lg text-xs flex items-center gap-2",
                    status.type === 'safe' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  )}>
                    {status.type === 'safe' ? (
                      <>
                        <TrendingUp className="w-3 h-3" />
                        Can bunk {status.count} more classes and stay above 70%
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        Attend {status.count} more classes to reach 70%
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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
            <p>Search for any student</p>
          </div>
        )}

        {query.length > 0 && filteredStudents.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>No students found</p>
          </div>
        )}

        {filteredStudents.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Found {filteredStudents.length} students - Click to view details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    <p className="font-medium text-sm truncate text-primary">{student.name.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">ID: {student.rollNumber}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
