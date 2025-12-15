import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock student data for search
const mockStudents = [
  { id: "1", name: "Rahul Sharma", rollNumber: "CS2021001", semester: 5, attendance: 82 },
  { id: "2", name: "Priya Patel", rollNumber: "CS2021002", semester: 5, attendance: 91 },
  { id: "3", name: "Amit Kumar", rollNumber: "CS2021003", semester: 5, attendance: 67 },
  { id: "4", name: "Sneha Singh", rollNumber: "CS2021004", semester: 5, attendance: 78 },
  { id: "5", name: "Vikram Mehta", rollNumber: "CS2021005", semester: 5, attendance: 85 },
  { id: "6", name: "Anjali Gupta", rollNumber: "CS2021006", semester: 5, attendance: 72 },
];

export default function Search() {
  const [query, setQuery] = useState("");
  
  const filteredStudents = query.length > 0
    ? mockStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.rollNumber.toLowerCase().includes(query.toLowerCase())
      )
    : [];

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
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-card rounded-xl p-4 border border-border flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.rollNumber}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-bold",
                    student.attendance >= 75 ? "text-success" : 
                    student.attendance >= 60 ? "text-warning" : "text-destructive"
                  )}>
                    {student.attendance}%
                  </p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
